from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from bson import ObjectId
import os
from dotenv import load_dotenv
import datetime
import random

# Load environment configuration
load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/nmpa_cargo")

# Setup MongoDB Connection
try:
    if "<cluster-url>" in MONGO_URI or "<username>" in MONGO_URI:
        raise ValueError("Placeholder values found in MONGO_URI connection string.")
    
    # Try connecting with a timeout of 3 seconds
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    # Trigger a connection check
    client.server_info()
    
    db = client.get_default_database()
    if db is None:
        db = client["nmpa_cargo"]
except Exception as e:
    print("\n" + "="*80)
    print(" CRITICAL ERROR: COULD NOT CONNECT TO MONGODB DATABASE")
    print("="*80)
    print(f"Error details: {e}")
    print("\nTo resolve this issue:")
    print("1. Open the backend/.env file.")
    print("2. Replace the MONGO_URI placeholder with your actual MongoDB Atlas connection string.")
    print("   Example: MONGO_URI=mongodb+srv://admin:secretPass@mycluster.mongodb.net/nmpa_cargo?...")
    print("3. Restart the backend server.")
    print("="*80 + "\n")
    import sys
    sys.exit(1)

# MongoDB Collections
users_col = db["users"]
inspections_col = db["inspections"]
audit_logs_col = db["audit_logs"]
complaints_col = db["complaints"]
chairman_office_inbox_col = db["chairman_office_inbox"]


def init_db():
    # Seed/Reset default users to match requested credentials
    for username, password, email, role in [
        ("Admin99", "Admin@123", "admin99@nmpa.gov", "system_admin"),
        ("Auth99", "Auth@123", "auth99@nmpa.gov", "port_authority"),
        ("Inspector99", "Insp@123", "inspector99@nmpa.gov", "inspector")
    ]:
        user = users_col.find_one({"username": username})
        if user:
            users_col.update_one(
                {"_id": user["_id"]},
                {"$set": {"password": password, "email": email, "role": role, "is_approved": True}}
            )
        else:
            users_col.insert_one({
                "username": username,
                "password": password,
                "email": email,
                "role": role,
                "is_approved": True,
                "two_fa_enabled": True,
                "last_login": None
            })
            
    # Clean up legacy default users
    users_col.delete_many({"username": {"$in": ["sysadmin", "auth1", "inspector1"]}})
    
    # Recalculate/migrate all existing inspections to use the new 3x3 risk matrix
    for doc in inspections_col.find():
        if "rms_risk_level" not in doc or not doc.get("rms_analysis_memo"):
            risk_level, risk_memo = ai_rms_assess(
                doc.get("cargo_type"), doc.get("country_of_origin"), doc.get("weight") or doc.get("gross_tonnage") or 0
            )
            inspections_col.update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "risk_level": risk_level,
                    "assigned_risk_level": risk_level,
                    "rms_risk_level": risk_level,
                    "inspection_summary": risk_memo,
                    "rms_analysis_memo": risk_memo
                }}
            )

def log_action(action, role, details=""):
    audit_logs_col.insert_one({
        "action": action,
        "user_role": role,
        "details": details,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# Simulated Email Sending
def send_email_notification(to_email, subject, body):
    print(f"--- MOCK EMAIL SENT ---")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")
    print(f"-----------------------")
    log_action("Email Sent", "System", f"Sent to {to_email} - Subject: {subject}")

# AI Engine
def ai_risk_assessment(cargo_data):
    risk_score = 0
    cargo_type = cargo_data.get('cargoType', '').lower()
    origin_port = cargo_data.get('originPort', '').lower()
    weight = float(cargo_data.get('weight', 0))

    if cargo_type == 'hazardous': risk_score += 50
    elif cargo_type == 'perishable': risk_score += 20
        
    high_risk_ports = ['high-risk-port', 'sanctioned', 'unknown']
    if any(port in origin_port for port in high_risk_ports): risk_score += 40
        
    if weight > 10000: risk_score += 15
    risk_score += random.randint(-5, 5)
    
    if risk_score >= 50: return 'High'
    elif risk_score >= 30: return 'Medium'
    else: return 'Low'

def ai_rms_assess(commodity_desc, country_of_origin, gross_tonnage):
    import json
    
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
        
    # 2. Determine Consequence/Severity based on Cargo Commodity Type & Tonnage
    critical_keywords = [
        "petroleum", "crude", "oil", "chemical", "acid", "gas", 
        "flammable", "explosive", "fertilizer", "sulfur", "methanol", "coal", "iron ore", "hazardous",
        "lng", "liquefied natural gas"
    ]
    elevated_keywords = [
        "timber", "cashew", "coffee", "cocoa", "electronics", "almond", "pharmaceutical",
        "machinery", "copper", "scrap metal", "silk", "spice", "tobacco"
    ]
    routine_keywords = [
        "textiles", "garments", "toys", "ceramics", "glassware", 
        "paper", "plastic goods", "furniture", "footwear", "tiles"
    ]
    
    found_critical = [k for k in critical_keywords if k in ct_lower]
    found_elevated = [k for k in elevated_keywords if k in ct_lower]
    found_routine = [k for k in routine_keywords if k in ct_lower]
    
    if found_critical:
        base_consequence = 3
        consequence_reason = f"High-hazard commodity ({found_critical[0].upper()})"
        commodity_trigger = found_critical[0].upper()
    elif found_elevated:
        base_consequence = 2
        consequence_reason = f"Standard/perishable commodity ({found_elevated[0].upper()})"
        commodity_trigger = found_elevated[0].upper()
    elif found_routine:
        base_consequence = 1
        consequence_reason = f"Routine dry commodity ({found_routine[0].upper()})"
        commodity_trigger = found_routine[0].upper()
    else:
        base_consequence = 1
        consequence_reason = "Default routine cargo classification"
        commodity_trigger = "GENERAL CARGO"
        
    # Consequence upgrades based on weight
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
    
    # 3. Calculate Risk Score using 3x3 Matrix
    risk_score = likelihood * consequence
    
    # 4. Map Risk Score to Risk Level Tier
    if risk_score >= 6:
        risk_rating = "CRITICAL RISK"
        focus_action = "MANDATORY PHYSICAL AUDIT: immediate cargo sampling, MSDS review, and flag registry verification."
    elif risk_score >= 3:
        risk_rating = "ELEVATED RISK"
        focus_action = "TARGETED AUDIT: verify phytosanitary papers, tariff registration, and scan seal integrity."
    else:
        risk_rating = "ROUTINE RISK"
        focus_action = "ROUTINE INSPECTION: calibrate weighbridge tonnage and run barcode visual scanning."
        
    primary_trigger = f"{commodity_trigger} [{likelihood}x{consequence}={risk_score}]"
    inspection_focus = f"{focus_action} | Origin: {likelihood_desc} | Impact: {consequence_desc}"
    
    confidence_score = 0.95 if risk_score >= 6 else (0.85 if risk_score >= 3 else 0.90)
    
    result = {
        "risk_rating": risk_rating,
        "confidence_score": confidence_score,
        "primary_trigger": primary_trigger,
        "inspection_focus": inspection_focus
    }
    
    return risk_rating, json.dumps(result)

# ---- USER AUTH & MANAGEMENT ENDPOINTS ----

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = users_col.find_one({"username": username, "password": password})
    if user:
        if not user.get("is_approved", False):
            return jsonify({"status": "error", "message": "Account pending approval from System Admin."}), 403
        
        # Record real-time login date/time
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        users_col.update_one({"_id": user["_id"]}, {"$set": {"last_login": now_str}})
        
        log_action("Login", user["role"], f"User {username} logged in")
        return jsonify({
            "status": "success", 
            "user": {
                "id": str(user["_id"]), 
                "username": user["username"], 
                "email": user["email"], 
                "role": user["role"], 
                "two_fa_enabled": user.get("two_fa_enabled", True)
            }
        }), 200
    return jsonify({"status": "error", "message": "Invalid credentials."}), 401

@app.route('/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_users():
    if request.method == 'GET':
        users = []
        for u in users_col.find():
            users.append({
                "id": str(u["_id"]),
                "username": u["username"],
                "email": u["email"],
                "role": u["role"],
                "is_approved": bool(u.get("is_approved", False)),
                "two_fa_enabled": bool(u.get("two_fa_enabled", True)),
                "last_login": u.get("last_login")
            })
        return jsonify(users), 200
        
    elif request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        role = data.get('role')
        
        # Enforce password strength rule:
        # 1. At least 8 characters
        # 2. At least one uppercase, one lowercase, one number, one special character
        import re
        if len(password) < 8 or not re.search("[a-z]", password) or not re.search("[A-Z]", password) or not re.search("[0-9]", password) or not re.search("[@$!%*?&]", password):
            return jsonify({"status": "error", "message": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."}), 400
            
        # Enforce username security rule:
        # 1. At least 4 characters
        # 2. Only alphanumeric and underscores
        if len(username) < 4 or not re.match("^[a-zA-Z0-9_]+$", username):
            return jsonify({"status": "error", "message": "Username must be at least 4 characters long and contain only letters, numbers, and underscores."}), 400
            
        # Enforce unique passwords constraint across all users
        if users_col.find_one({"password": password}):
            return jsonify({"status": "error", "message": "This password is already in use by another account. Please use a unique password."}), 400
            
        if users_col.find_one({"username": username}):
            return jsonify({"status": "error", "message": "Username already exists"}), 400
            
        new_user = {
            "username": username,
            "password": password,
            "email": email,
            "role": role,
            "is_approved": False,
            "two_fa_enabled": True,
            "last_login": None
        }
        users_col.insert_one(new_user)
        log_action("Create User", "system_admin", f"Created user {username}")
        return jsonify({"status": "success"}), 201
            
    elif request.method == 'PUT':
        data = request.json
        user_id = data.get('id')
        action = data.get('action') # 'approve', 'toggle_2fa', or None for edit
        
        try:
            obj_id = ObjectId(user_id)
        except:
            return jsonify({"status": "error", "message": "Invalid user ID format."}), 400
        
        if action == 'approve':
            users_col.update_one({"_id": obj_id}, {"$set": {"is_approved": True}})
            user_data = users_col.find_one({"_id": obj_id})
            log_action("Approve User", "system_admin", f"Approved user ID {user_id}")
            if user_data:
                send_email_notification(user_data["email"], "Account Approved", f"Hello {user_data['username']}, your NMPA account has been approved by the System Admin.")
        elif action == 'toggle_2fa':
            user_data = users_col.find_one({"_id": obj_id})
            if user_data:
                new_val = not user_data.get("two_fa_enabled", True)
                users_col.update_one({"_id": obj_id}, {"$set": {"two_fa_enabled": new_val}})
                log_action("Toggle 2FA", "system_admin", f"Toggled 2FA for user ID {user_id}")
        else:
            # Inline edit user details
            username = data.get('username')
            email = data.get('email')
            role = data.get('role')
            users_col.update_one({"_id": obj_id}, {"$set": {
                "username": username,
                "email": email,
                "role": role
            }})
            log_action("Edit User Details", "system_admin", f"Updated user ID {user_id} details")
            
        return jsonify({"status": "success"}), 200
        
    elif request.method == 'DELETE':
        user_id = request.args.get('id')
        try:
            users_col.delete_one({"_id": ObjectId(user_id)})
            log_action("Delete User", "system_admin", f"Deleted user ID {user_id}")
            return jsonify({"status": "success"}), 200
        except:
            return jsonify({"status": "error", "message": "Invalid user ID."}), 400

# ---- INSPECTION ENDPOINTS ----

@app.route('/api/evaluate', methods=['POST'])
def evaluate_cargo():
    data = request.json
    vessel_imo = data.get('vesselImo', '')
    vessel_name = data.get('vesselName', '')
    country_of_origin = data.get('countryOfOrigin', '')
    bill_of_lading = data.get('billOfLading', '')
    commodity_desc = data.get('commodityDescription', '')
    gross_tonnage = float(data.get('grossTonnage', 0))
    inspector_email = data.get('inspectorEmail', 'unknown@nmpa.gov')
    
    risk_level, risk_memo = ai_rms_assess(commodity_desc, country_of_origin, gross_tonnage)
    
    new_inspection = {
        "bill_of_lading": bill_of_lading,
        "origin_port": country_of_origin,
        "cargo_type": commodity_desc,
        "weight": gross_tonnage,
        "image_url": "",
        "risk_level": risk_level,
        "status": "Awaiting Physical Inspection",
        "inspector_email": inspector_email,
        "assigned_risk_level": risk_level,
        "inspection_summary": risk_memo,
        "vessel_imo": vessel_imo,
        "vessel_name": vessel_name,
        "country_of_origin": country_of_origin,
        "gross_tonnage": gross_tonnage,
        "rms_risk_level": risk_level,
        "rms_analysis_memo": risk_memo,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "actual_weight": None,
        "seal_intact": None,
        "structural_damage": None,
        "qr_token": None
    }
    
    res = inspections_col.insert_one(new_inspection)
    
    log_action("Register Manifest", "inspector", f"B/L {bill_of_lading} submitted for Vessel {vessel_name}")
    return jsonify({
        "id": str(res.inserted_id), 
        "rms_risk_level": risk_level, 
        "rms_analysis_memo": risk_memo, 
        "status": "Awaiting Physical Inspection"
    }), 200

@app.route('/api/clearance/verify', methods=['GET'])
def verify_clearance_api():
    token = request.args.get('token')
    if not token:
        return jsonify({"status": "error", "message": "Missing verification token."}), 400
        
    r = inspections_col.find_one({"qr_token": token})
    if not r:
        return jsonify({"status": "error", "message": "Clearance certificate not found or invalid."}), 404
        
    return jsonify({
        "id": str(r["_id"]), 
        "bill_of_lading": r.get("bill_of_lading"), 
        "origin_port": r.get("origin_port"), 
        "cargo_type": r.get("cargo_type"), 
        "weight": r.get("weight"), 
        "risk_level": r.get("risk_level"), 
        "status": r.get("status"), 
        "notes": r.get("notes"),
        "date": r.get("timestamp"),
        "actual_weight": r.get("actual_weight"),
        "seal_intact": bool(r["seal_intact"]) if r.get("seal_intact") is not None else None,
        "structural_damage": bool(r["structural_damage"]) if r.get("structural_damage") is not None else None,
        "qr_token": r.get("qr_token"),
        "assigned_risk_level": r.get("assigned_risk_level"),
        "inspection_summary": r.get("inspection_summary"),
        "vessel_imo": r.get("vessel_imo"),
        "vessel_name": r.get("vessel_name"),
        "country_of_origin": r.get("country_of_origin"),
        "gross_tonnage": r.get("gross_tonnage") if r.get("gross_tonnage") is not None else r.get("weight"),
        "rms_risk_level": r.get("rms_risk_level") if r.get("rms_risk_level") is not None else r.get("assigned_risk_level"),
        "rms_analysis_memo": r.get("rms_analysis_memo") if r.get("rms_analysis_memo") is not None else r.get("inspection_summary")
    }), 200

@app.route('/api/inspections', methods=['GET'])
def get_inspections():
    inspector_email = request.args.get('inspectorEmail')
    
    if inspector_email:
        cursor = inspections_col.find({"inspector_email": inspector_email}).sort("_id", pymongo.DESCENDING)
    else:
        cursor = inspections_col.find().sort("_id", pymongo.DESCENDING)
        
    result = []
    for r in cursor:
        result.append({
            "id": str(r["_id"]), 
            "bill_of_lading": r.get("bill_of_lading"), 
            "origin_port": r.get("origin_port"), 
            "cargo_type": r.get("cargo_type"), 
            "weight": r.get("weight"), 
            "image_url": r.get("image_url"), 
            "risk_level": r.get("risk_level"), 
            "status": r.get("status"), 
            "notes": r.get("notes"),
            "inspector_email": r.get("inspector_email"), 
            "date": r.get("timestamp"),
            "actual_weight": r.get("actual_weight"),
            "seal_intact": bool(r["seal_intact"]) if r.get("seal_intact") is not None else None,
            "structural_damage": bool(r["structural_damage"]) if r.get("structural_damage") is not None else None,
            "qr_token": r.get("qr_token"),
            "assigned_risk_level": r.get("assigned_risk_level"),
            "inspection_summary": r.get("inspection_summary"),
            "vessel_imo": r.get("vessel_imo"),
            "vessel_name": r.get("vessel_name"),
            "country_of_origin": r.get("country_of_origin"),
            "gross_tonnage": r.get("gross_tonnage") if r.get("gross_tonnage") is not None else r.get("weight"),
            "rms_risk_level": r.get("rms_risk_level") if r.get("rms_risk_level") is not None else r.get("assigned_risk_level"),
            "rms_analysis_memo": r.get("rms_analysis_memo") if r.get("rms_analysis_memo") is not None else r.get("inspection_summary")
        })
    return jsonify(result), 200

@app.route('/api/inspections/inspect', methods=['POST'])
def inspect_cargo():
    data = request.json
    manifest_id = data.get('manifestId')
    inspection_id = data.get('id')
    actual_weight = data.get('actual_weight')
    seal_intact = data.get('seal_intact')
    structural_damage = data.get('structural_damage')
    image_url = data.get('image_url')
    
    query = {}
    if inspection_id:
        try:
            query["_id"] = ObjectId(inspection_id)
        except:
            return jsonify({"status": "error", "message": "Invalid ID format"}), 400
    else:
        query["bill_of_lading"] = manifest_id
        
    query["status"] = {"$in": ["Pending", "Awaiting Physical Inspection"]}
    
    inspections_col.update_one(query, {"$set": {
        "actual_weight": actual_weight,
        "seal_intact": seal_intact,
        "structural_damage": structural_damage,
        "image_url": image_url,
        "status": "Inspected - Awaiting Authority Adjudication"
    }})
        
    log_action("Inspect Cargo", "inspector", f"BoL {manifest_id or inspection_id} physical inspection completed.")
    return jsonify({"status": "success"}), 200

@app.route('/api/inspections/review', methods=['POST'])
def review_inspection():
    data = request.json
    inspection_id = data.get('id')
    status = data.get('status') # 'Approved', 'Rejected', 'Port Clearance Granted', 'Clearance Denied - Detained for Physical Audit'
    notes = data.get('notes')
    
    try:
        obj_id = ObjectId(inspection_id)
    except:
        return jsonify({"status": "error", "message": "Invalid ID format"}), 400
        
    # Strictly enforce that approved/granted cargo cannot be modified
    row = inspections_col.find_one({"_id": obj_id})
    if row and row.get("status") in ['Approved', 'Port Clearance Granted']:
        return jsonify({"status": "error", "message": "This cargo/vessel manifest has already been cleared and approved. Decisions are final and cannot be modified."}), 400
        
    qr_token = None
    if status in ['Approved', 'Port Clearance Granted']:
        qr_token = f"NMPA-PCC-{inspection_id}-{random.randint(100000, 999999)}"
        inspections_col.update_one({"_id": obj_id}, {"$set": {
            "status": status,
            "notes": notes,
            "qr_token": qr_token
        }})
    elif status == 'Re-Inspect':
        # Re-inspect resets status back to Pending and clears inspector fields
        inspections_col.update_one({"_id": obj_id}, {"$set": {
            "status": "Pending",
            "notes": notes,
            "actual_weight": None,
            "seal_intact": None,
            "structural_damage": None
        }})
    else:
        inspections_col.update_one({"_id": obj_id}, {"$set": {
            "status": status,
            "notes": notes
        }})
    
    # Get inspector email to send notification
    row = inspections_col.find_one({"_id": obj_id})
    if row:
        inspector_email = row.get("inspector_email")
        bol = row.get("bill_of_lading")
        subject = f"NMPA Custom Adjudication - {status} - B/L {bol}"
        body = f"The Import General Manifest for Bill of Lading {bol} has been marked as {status} by the Port Authority.\nAdjudication Notes: {notes}"
        send_email_notification(inspector_email, subject, body)
        
    log_action("Review Adjudication", "port_authority", f"Manifest {inspection_id} marked as {status}")
    return jsonify({"status": "success", "qrToken": qr_token}), 200

@app.route('/api/public-metrics', methods=['GET'])
def get_public_metrics():
    total_inspections = inspections_col.count_documents({})
    pending_inspections = inspections_col.count_documents({"status": {"$in": ["Pending", "Awaiting Physical Inspection"]}})
    completed_inspections = inspections_col.count_documents({"status": {"$nin": ["Pending", "Awaiting Physical Inspection"]}})

    pre_berthing = max(0.2, round(0.78 + (pending_inspections * 0.02), 2))
    trt = max(10.0, round(43.23 + (pending_inspections * 0.15), 2))

    cleared_tonnage = 0
    for doc in inspections_col.find({"status": {"$in": ["Approved", "Port Clearance Granted"]}}):
        cleared_tonnage += doc.get("gross_tonnage") or doc.get("weight") or 0
    berth_output = int(19535 + (cleared_tonnage / 20))

    operating_ratio = 38.61
    if total_inspections > 0:
        operating_ratio = round(38.61 + (completed_inspections - pending_inspections) * 0.1, 2)

    import time
    try:
        start_time = time.mktime(time.strptime("2026-06-01 00:00:00", "%Y-%m-%d %H:%M:%S"))
        current_time = time.time()
        delta_seconds = max(0, current_time - start_time)
        solar_generated = round(59.26 + (delta_seconds * 0.000002), 6)
    except:
        solar_generated = 59.26

    return jsonify({
        "pre_berthing_detention": pre_berthing,
        "average_trt": trt,
        "output_per_berth_day": berth_output,
        "operating_ratio": operating_ratio,
        "solar_generated": solar_generated
    }), 200

@app.route('/api/logs', methods=['GET'])
def get_logs():
    logs = []
    for r in audit_logs_col.find().sort("_id", pymongo.DESCENDING):
        logs.append({
            "id": str(r["_id"]),
            "action": r.get("action"),
            "role": r.get("user_role"),
            "details": r.get("details"),
            "date": r.get("timestamp")
        })
    return jsonify(logs), 200

@app.route('/api/complaints', methods=['GET', 'POST'])
def handle_complaints():
    if request.method == 'POST':
        data = request.json or {}
        email = data.get('email')
        subject = data.get('subject') or data.get('category')
        message = data.get('message') or data.get('description')
        is_escalated = data.get('is_escalated_to_chairman') or data.get('isEscalatedToChairman')
        severity = data.get('severity_level') or data.get('severityLevel') or 'Medium'
        
        if isinstance(is_escalated, str):
            is_escalated = is_escalated.lower() == 'true'
        else:
            is_escalated = bool(is_escalated)
            
        if is_escalated:
            res = chairman_office_inbox_col.insert_one({
                "email": email,
                "category": subject,
                "description": message,
                "is_escalated_to_chairman": True,
                "severity_level": severity,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            log_action("Escalate Complaint", "System", f"Escalated complaint by {email} to Chairman")
            return jsonify({
                "status": "success", 
                "message": "Grievance escalated directly to Chairman.",
                "routed_to": "CHAIRMAN_OFFICE_INBOX",
                "id": str(res.inserted_id)
            }), 201
        else:
            res = complaints_col.insert_one({
                "inspector_email": email,
                "subject": subject,
                "message": message,
                "is_escalated_to_chairman": False,
                "severity_level": severity,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            log_action("Submit Complaint", "System", f"Complaint submitted by {email}")
            return jsonify({
                "status": "success", 
                "message": "Complaint submitted to standard queue.",
                "routed_to": "STANDARD_GRIEVANCE_QUEUE",
                "id": str(res.inserted_id)
            }), 201
        
    else:
        result = []
        for r in complaints_col.find().sort("_id", pymongo.DESCENDING):
            result.append({
                "id": str(r["_id"]),
                "email": r.get("inspector_email"),
                "subject": r.get("subject"),
                "message": r.get("message"),
                "date": r.get("timestamp"),
                "is_escalated_to_chairman": bool(r.get("is_escalated_to_chairman")),
                "severity_level": r.get("severity_level")
            })
        return jsonify(result), 200

@app.route('/api/chairman/complaints', methods=['GET'])
def get_chairman_complaints():
    result = []
    for r in chairman_office_inbox_col.find().sort("_id", pymongo.DESCENDING):
        result.append({
            "id": str(r["_id"]),
            "email": r.get("email"),
            "subject": r.get("category"),
            "message": r.get("description"),
            "severity_level": r.get("severity_level"),
            "date": r.get("timestamp"),
            "is_escalated_to_chairman": True
        })
    return jsonify(result), 200

if __name__ == '__main__':
    init_db()
    # Read port from environment, fallback to 5000
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
