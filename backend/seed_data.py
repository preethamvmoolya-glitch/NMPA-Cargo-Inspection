import os
import datetime
import random
import json
import pymongo
from dotenv import load_dotenv

# Load environment configuration
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/nmpa_cargo")

# Fallback to local MongoDB if placeholder is detected
if "<cluster-url>" in MONGO_URI or "<username>" in MONGO_URI:
    print("Placeholder values found in MONGO_URI. Falling back to local MongoDB...")
    MONGO_URI = "mongodb://localhost:27017/nmpa_cargo"

print("Connecting to MongoDB at:", MONGO_URI)
try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    client.server_info()
    db = client.get_default_database()
    if db is None:
        db = client["nmpa_cargo"]
    print("Successfully connected to database:", db.name)
except Exception as e:
    # Try one last fallback to local default if not already tried
    if MONGO_URI != "mongodb://localhost:27017/nmpa_cargo":
        print(f"Failed to connect to configured URI. Falling back to local MongoDB: {e}")
        try:
            MONGO_URI = "mongodb://localhost:27017/nmpa_cargo"
            client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
            client.server_info()
            db = client["nmpa_cargo"]
            print("Successfully connected to local database:", db.name)
        except Exception as e2:
            print(f"Could not connect to local MongoDB: {e2}")
            exit(1)
    else:
        print(f"Error connecting to local MongoDB: {e}")
        exit(1)

# Collections
users_col = db["users"]
inspections_col = db["inspections"]
complaints_col = db["complaints"]
chairman_office_inbox_col = db["chairman_office_inbox"]
audit_logs_col = db["audit_logs"]

def ai_rms_assess(commodity_desc, country_of_origin, gross_tonnage):
    ct_lower = (commodity_desc or "").lower()
    co_lower = (country_of_origin or "").lower()
    weight = float(gross_tonnage or 0)
    
    # 1. Determine Likelihood based on Country of Origin
    safe_countries = [
        "singapore", "japan", "germany", "united kingdom", "uk", "united states", "usa", 
        "canada", "australia", "united arab emirates", "uae", "france", "netherlands"
    ]
    high_risk_countries = [
        "sanctioned", "unknown", "high-risk", "north korea", "iran", "syria", 
        "somalia", "yemen", "venezuela", "libya"
    ]
    
    is_safe = any(sc in co_lower for sc in safe_countries)
    is_high = any(hc in co_lower for hc in high_risk_countries)
    
    if is_high or not co_lower.strip():
        likelihood = 3
        likelihood_desc = "High (Origin matches high-risk/sanctioned database)"
    elif is_safe:
        likelihood = 1
        likelihood_desc = "Low (Origin is verified pre-approved safe partner)"
    else:
        likelihood = 2
        likelihood_desc = "Medium (Standard maritime security profile)"
        
    # 2. Consequence
    critical_keywords = ["petroleum", "crude", "oil", "chemical", "acid", "gas", "flammable", "explosive", "fertilizer", "sulfur", "hazardous"]
    elevated_keywords = ["cashew", "coffee", "cocoa", "electronics", "pharmaceutical", "machinery", "copper"]
    
    found_critical = [k for k in critical_keywords if k in ct_lower]
    found_elevated = [k for k in elevated_keywords if k in ct_lower]
    
    if found_critical:
        base_consequence = 3
        consequence_reason = f"High-hazard commodity ({found_critical[0].upper()})"
        commodity_trigger = found_critical[0].upper()
    elif found_elevated:
        base_consequence = 2
        consequence_reason = f"Standard/perishable commodity ({found_elevated[0].upper()})"
        commodity_trigger = found_elevated[0].upper()
    else:
        base_consequence = 1
        consequence_reason = "Default routine cargo classification"
        commodity_trigger = "GENERAL CARGO"
        
    consequence = base_consequence
    weight_trigger = ""
    if weight > 15000:
        if consequence < 3:
            consequence = 3
            weight_trigger = f" (Escalated to High: {weight:,.0f} MT > 15k MT)"
        else:
            weight_trigger = f" (High weight: {weight:,.0f} MT)"
    elif weight > 5000:
        if consequence < 2:
            consequence = 2
            weight_trigger = f" (Escalated to Med: {weight:,.0f} MT > 5k MT)"
        else:
            weight_trigger = f" (Med weight: {weight:,.0f} MT)"
            
    consequence_desc = f"Level {consequence} - {consequence_reason}{weight_trigger}"
    risk_score = likelihood * consequence
    
    if risk_score >= 6:
        risk_rating = "CRITICAL RISK"
        focus_action = "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification."
    elif risk_score >= 3:
        risk_rating = "ELEVATED RISK"
        focus_action = "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity."
    else:
        risk_rating = "ROUTINE RISK"
        focus_action = "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning."
        
    result = {
        "risk_rating": risk_rating,
        "confidence_score": 0.95 if risk_score >= 6 else (0.85 if risk_score >= 3 else 0.90),
        "primary_trigger": f"{commodity_trigger} [{likelihood}x{consequence}={risk_score}]",
        "inspection_focus": f"{focus_action} | Origin: {likelihood_desc} | Impact: {consequence_desc}"
    }
    return risk_rating, json.dumps(result)

def seed():
    # 1. Clear existing non-user data to prevent duplication issues during presentation
    print("Clearing inspections, complaints, chairman inbox, and audit logs...")
    inspections_col.delete_many({})
    complaints_col.delete_many({})
    chairman_office_inbox_col.delete_many({})
    audit_logs_col.delete_many({})

    # Ensure users exist
    print("Seeding demo users...")
    for username, password, email, role in [
        ("Admin99", "Admin@123", "admin99@nmpa.gov", "system_admin"),
        ("Auth99", "Auth@123", "auth99@nmpa.gov", "port_authority"),
        ("Inspector99", "Insp@123", "inspector99@nmpa.gov", "inspector")
    ]:
        user = users_col.find_one({"username": username})
        if not user:
            users_col.insert_one({
                "username": username,
                "password": password,
                "email": email,
                "role": role,
                "is_approved": True,
                "two_fa_enabled": True,
                "last_login": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })

    # Seed inspections
    print("Seeding manifest inspections...")
    now = datetime.datetime.now()
    
    inspections_data = [
        {
            "bill_of_lading": "BOL-PET-9021",
            "country_of_origin": "Iran",
            "commodity_desc": "Crude Petroleum (UN 1267 Flammable)",
            "gross_tonnage": 18500.0,
            "status": "Awaiting Physical Inspection",
            "vessel_imo": "IMO9182736",
            "vessel_name": "M.T. Sovereign",
            "timestamp": (now - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": None,
            "seal_intact": None,
            "structural_damage": None,
            "qr_token": None,
            "notes": None
        },
        {
            "bill_of_lading": "BOL-CAS-5512",
            "country_of_origin": "Vietnam",
            "commodity_desc": "Cashew Nuts (Raw Agricultural)",
            "gross_tonnage": 8500.0,
            "status": "Inspected - Awaiting Authority Adjudication",
            "vessel_imo": "IMO9203847",
            "vessel_name": "Cashew Queen",
            "timestamp": (now - datetime.timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": 8512.5,
            "seal_intact": True,
            "structural_damage": False,
            "qr_token": None,
            "notes": "Customs seal checked. Cashew quality certification attached. Weight within tolerance (+0.14%)."
        },
        {
            "bill_of_lading": "BOL-TEX-1039",
            "country_of_origin": "Singapore",
            "commodity_desc": "Cotton Textiles & Garments",
            "gross_tonnage": 3200.0,
            "status": "Port Clearance Granted",
            "vessel_imo": "IMO9312984",
            "vessel_name": "Silk Road Express",
            "timestamp": (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": 3200.0,
            "seal_intact": True,
            "structural_damage": False,
            "qr_token": "NMPA-PCC-676b92a3f91-10298",
            "notes": "Verified at weighbridge #2. Barcode scanner completed validation. Authority cleared for unloading."
        },
        {
            "bill_of_lading": "BOL-SUL-4028",
            "country_of_origin": "Somalia",
            "commodity_desc": "Granular Sulfur (Hazardous Class 4)",
            "gross_tonnage": 16000.0,
            "status": "Clearance Denied - Detained for Physical Audit",
            "vessel_imo": "IMO9048372",
            "vessel_name": "Volcano Trader",
            "timestamp": (now - datetime.timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": 16010.0,
            "seal_intact": True,
            "structural_damage": True,
            "qr_token": None,
            "notes": "Container wall shows slight structural degradation. Detained in hazardous cargo bay B3 pending chemical sampling."
        },
        {
            "bill_of_lading": "BOL-COF-6677",
            "country_of_origin": "Brazil",
            "commodity_desc": "Arabica Coffee Beans",
            "gross_tonnage": 9000.0,
            "status": "Awaiting Physical Inspection",
            "vessel_imo": "IMO9174829",
            "vessel_name": "Arabica Carrier",
            "timestamp": (now - datetime.timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": None,
            "seal_intact": None,
            "structural_damage": None,
            "qr_token": None,
            "notes": None
        },
        {
            "bill_of_lading": "BOL-CER-1122",
            "country_of_origin": "Japan",
            "commodity_desc": "Porcelain Tiles & Decorative Ceramics",
            "gross_tonnage": 4500.0,
            "status": "Approved",
            "vessel_imo": "IMO9283746",
            "vessel_name": "Claymore Liner",
            "timestamp": (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": 4498.2,
            "seal_intact": True,
            "structural_damage": False,
            "qr_token": "NMPA-PCC-CER-198273",
            "notes": "Routine inspection passed. Clean bill of health. Custom clearance approved."
        },
        {
            "bill_of_lading": "BOL-METH-3310",
            "country_of_origin": "Venezuela",
            "commodity_desc": "Liquid Methanol (Hazardous UN 1230)",
            "gross_tonnage": 22000.0,
            "status": "Inspected - Awaiting Authority Adjudication",
            "vessel_imo": "IMO9247384",
            "vessel_name": "M.T. Nebula",
            "timestamp": (now - datetime.timedelta(hours=12)).strftime("%Y-%m-%d %H:%M:%S"),
            "actual_weight": 21995.0,
            "seal_intact": True,
            "structural_damage": False,
            "qr_token": None,
            "notes": "Pressure valve integrity checked. Chemical compliance sheet uploaded. Waiting authority sign-off."
        }
    ]

    for item in inspections_data:
        risk_level, risk_memo = ai_rms_assess(item["commodity_desc"], item["country_of_origin"], item["gross_tonnage"])
        
        inspections_col.insert_one({
            "bill_of_lading": item["bill_of_lading"],
            "origin_port": item["country_of_origin"],
            "cargo_type": item["commodity_desc"],
            "weight": item["gross_tonnage"],
            "image_url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec" if item["actual_weight"] else "",
            "risk_level": risk_level,
            "status": item["status"],
            "inspector_email": "inspector99@nmpa.gov",
            "assigned_risk_level": risk_level,
            "inspection_summary": risk_memo,
            "vessel_imo": item["vessel_imo"],
            "vessel_name": item["vessel_name"],
            "country_of_origin": item["country_of_origin"],
            "gross_tonnage": item["gross_tonnage"],
            "rms_risk_level": risk_level,
            "rms_analysis_memo": risk_memo,
            "timestamp": item["timestamp"],
            "actual_weight": item["actual_weight"],
            "seal_intact": item["seal_intact"],
            "structural_damage": item["structural_damage"],
            "qr_token": item["qr_token"],
            "notes": item["notes"]
        })

    # Seed Complaints
    print("Seeding grievances...")
    complaints_col.insert_one({
        "inspector_email": "inspector99@nmpa.gov",
        "subject": "Weighbridge Calibration Variance",
        "message": "Weighbridge #3 is showing a deviation of +5kg per Metric Ton compared to weighbridge #1. Needs urgent maintenance recalibration.",
        "is_escalated_to_chairman": False,
        "severity_level": "Medium",
        "timestamp": (now - datetime.timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S")
    })

    chairman_office_inbox_col.insert_one({
        "email": "auth99@nmpa.gov",
        "category": "Unregistered Vessel In Anchorage Area",
        "description": "An unregistered merchant ship (without transponding AIS signals) was observed waiting outside the harbor limits. Local Port Security and Coast Guard have been alerted.",
        "is_escalated_to_chairman": True,
        "severity_level": "High",
        "timestamp": (now - datetime.timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S")
    })

    # Seed Audit Logs
    print("Seeding system logs...")
    audit_logs_col.insert_many([
        {
            "action": "Register Manifest",
            "user_role": "inspector",
            "details": "Registered new General Cargo manifest for Vessel M.T. Sovereign (B/L: BOL-PET-9021).",
            "timestamp": (now - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
        },
        {
            "action": "Inspect Cargo",
            "user_role": "inspector",
            "details": "Physical inspection recorded for Cashew Queen (B/L: BOL-CAS-5512). Seal intact.",
            "timestamp": (now - datetime.timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")
        },
        {
            "action": "Review Adjudication",
            "user_role": "port_authority",
            "details": "Port Clearance Granted for Silk Road Express (B/L: BOL-TEX-1039). PCC Certificate generated.",
            "timestamp": (now - datetime.timedelta(hours=20)).strftime("%Y-%m-%d %H:%M:%S")
        },
        {
            "action": "Escalate Complaint",
            "user_role": "System",
            "details": "Escalated security alert from auth99@nmpa.gov directly to Chairman Office Inbox.",
            "timestamp": (now - datetime.timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S")
        },
        {
            "action": "User Login",
            "user_role": "system_admin",
            "details": "User Admin99 logged in successfully from station terminal ADMIN-4.",
            "timestamp": (now - datetime.timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S")
        }
    ])

    print("\nDatabase seeding completed successfully!")
    print(f"Inspections loaded: {inspections_col.count_documents({})}")
    print(f"Grievances loaded: {complaints_col.count_documents({})} standard, {chairman_office_inbox_col.count_documents({})} escalated")
    print(f"Audit logs loaded: {audit_logs_col.count_documents({})}")

if __name__ == "__main__":
    seed()
