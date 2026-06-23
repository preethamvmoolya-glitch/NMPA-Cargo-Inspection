from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime
import random

app = Flask(__name__)
CORS(app)

DB_NAME = "cargo.db"

def get_db():
    conn = sqlite3.connect(DB_NAME, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            is_approved BOOLEAN DEFAULT 0,
            two_fa_enabled BOOLEAN DEFAULT 1,
            last_login TEXT
        )
    ''')
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_login TEXT")
    except sqlite3.OperationalError:
        # column already exists
        pass
    
    # Inspections table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bill_of_lading TEXT NOT NULL,
            origin_port TEXT NOT NULL,
            cargo_type TEXT NOT NULL,
            weight REAL NOT NULL,
            image_url TEXT,
            risk_level TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            inspector_email TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            actual_weight REAL,
            seal_intact BOOLEAN,
            structural_damage BOOLEAN,
            qr_token TEXT
        )
    ''')
    for col, col_type in [("actual_weight", "REAL"), ("seal_intact", "BOOLEAN"), ("structural_damage", "BOOLEAN"), ("qr_token", "TEXT"), ("assigned_risk_level", "TEXT"), ("inspection_summary", "TEXT"), ("vessel_imo", "TEXT"), ("vessel_name", "TEXT"), ("country_of_origin", "TEXT"), ("gross_tonnage", "REAL"), ("rms_risk_level", "TEXT"), ("rms_analysis_memo", "TEXT")]:
        try:
            cursor.execute(f"ALTER TABLE inspections ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass
    
    # Audit Logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            user_role TEXT NOT NULL,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Complaints table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inspector_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_escalated_to_chairman BOOLEAN DEFAULT 0,
            severity_level TEXT
        )
    ''')
    for col, col_type in [("is_escalated_to_chairman", "BOOLEAN DEFAULT 0"), ("severity_level", "TEXT")]:
        try:
            cursor.execute(f"ALTER TABLE complaints ADD COLUMN {col} {col_type}")
        except sqlite3.OperationalError:
            pass

    # Chairman Office Inbox table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chairman_office_inbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            is_escalated_to_chairman BOOLEAN DEFAULT 1,
            severity_level TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')


    # Clean up legacy default users
    cursor.execute("DELETE FROM users WHERE username IN ('sysadmin', 'auth1', 'inspector1')")
    
    # Seed/Reset default users to match requested credentials
    for username, password, email, role in [
        ("Admin99", "Admin@123", "admin99@nmpa.gov", "system_admin"),
        ("Auth99", "Auth@123", "auth99@nmpa.gov", "port_authority"),
        ("Inspector99", "Insp@123", "inspector99@nmpa.gov", "inspector")
    ]:
        cursor.execute("SELECT id FROM users WHERE username=?", (username,))
        row = cursor.fetchone()
        if row:
            cursor.execute("UPDATE users SET password=?, email=?, role=?, is_approved=1 WHERE id=?", (password, email, role, row[0]))
        else:
            cursor.execute("INSERT INTO users (username, password, email, role, is_approved, two_fa_enabled) VALUES (?, ?, ?, ?, 1, 1)", 
                           (username, password, email, role))
        
    conn.commit()
    conn.close()

def log_action(action, role, details=""):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO audit_logs (action, user_role, details) VALUES (?, ?, ?)", (action, role, details))
    conn.commit()
    conn.close()

# Simulated Email Sending
def send_email_notification(to_email, subject, body):
    # In a real app, use SMTP or an email API like SendGrid
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

def ai_rms_assess(commodity_desc):
    ct_lower = commodity_desc.lower()
    
    # Check for Critical Risk
    critical_keywords = ['oil', 'petroleum', 'chemical', 'lng', 'liquefied natural gas', 'iron ore', 'coal', 'hazardous']
    # Check for Elevated Risk
    elevated_keywords = ['cashew', 'coffee', 'cocoa', 'almond', 'electronic', 'textile', 'pharmaceutical']
    
    if any(k in ct_lower for k in critical_keywords):
        risk = "CRITICAL RISK"
        memo = f"CRITICAL RISK: Identified volatile, hazardous, or high-logistical-impact bulk cargo ({commodity_desc}). Requires strict regulatory adjudication, temperature logs, and pressure certification verification."
    elif any(k in ct_lower for k in elevated_keywords):
        risk = "ELEVATED RISK"
        memo = f"ELEVATED RISK: Identified perishable agricultural commodity or high-tariff cargo ({commodity_desc}). Requires standard phytosanitary clearances, pest certifications, and customs tariff validation."
    else:
        risk = "ROUTINE RISK"
        memo = f"ROUTINE RISK: Stable, non-hazardous dry cargo ({commodity_desc}). Recommended for routine customs clearance with standard administrative verification."
        
    return risk, memo

# ---- USER AUTH & MANAGEMENT ENDPOINTS ----

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, role, is_approved, two_fa_enabled FROM users WHERE username=? AND password=?", (username, password))
    user = cursor.fetchone()
    
    if user:
        if not user[4]: # is_approved
            conn.close()
            return jsonify({"status": "error", "message": "Account pending approval from System Admin."}), 403
        
        # Record real-time login date/time
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("UPDATE users SET last_login=? WHERE id=?", (now_str, user[0]))
        conn.commit()
        conn.close()
        
        log_action("Login", user[3], f"User {username} logged in")
        return jsonify({
            "status": "success", 
            "user": {"id": user[0], "username": user[1], "email": user[2], "role": user[3], "two_fa_enabled": user[5]}
        }), 200
    conn.close()
    return jsonify({"status": "error", "message": "Invalid credentials."}), 401

@app.route('/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_users():
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute("SELECT id, username, email, role, is_approved, two_fa_enabled, last_login FROM users")
        users = [{"id": r[0], "username": r[1], "email": r[2], "role": r[3], "is_approved": bool(r[4]), "two_fa_enabled": bool(r[5]), "last_login": r[6]} for r in cursor.fetchall()]
        conn.close()
        return jsonify(users), 200
        
    elif request.method == 'POST':
        # Create user (used by sysadmin or registration)
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
            conn.close()
            return jsonify({"status": "error", "message": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."}), 400
            
        # Enforce username security rule:
        # 1. At least 4 characters
        # 2. Only alphanumeric and underscores
        if len(username) < 4 or not re.match("^[a-zA-Z0-9_]+$", username):
            conn.close()
            return jsonify({"status": "error", "message": "Username must be at least 4 characters long and contain only letters, numbers, and underscores."}), 400
            
        # Enforce unique passwords constraint across all users
        cursor.execute("SELECT id FROM users WHERE password=?", (password,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"status": "error", "message": "This password is already in use by another account. Please use a unique password."}), 400
            
        try:
            cursor.execute("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)", 
                           (username, password, email, role))
            conn.commit()
            log_action("Create User", "system_admin", f"Created user {username}")
            conn.close()
            return jsonify({"status": "success"}), 201
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({"status": "error", "message": "Username already exists"}), 400
            
    elif request.method == 'PUT':
        data = request.json
        user_id = data.get('id')
        action = data.get('action') # 'approve', 'toggle_2fa', or None for edit
        
        if action == 'approve':
            cursor.execute("UPDATE users SET is_approved=1 WHERE id=?", (user_id,))
            cursor.execute("SELECT email, username FROM users WHERE id=?", (user_id,))
            user_data = cursor.fetchone()
            log_action("Approve User", "system_admin", f"Approved user ID {user_id}")
            if user_data:
                send_email_notification(user_data[0], "Account Approved", f"Hello {user_data[1]}, your NMPA account has been approved by the System Admin.")
        elif action == 'toggle_2fa':
            cursor.execute("UPDATE users SET two_fa_enabled = NOT two_fa_enabled WHERE id=?", (user_id,))
            log_action("Toggle 2FA", "system_admin", f"Toggled 2FA for user ID {user_id}")
        else:
            # Inline edit user details
            username = data.get('username')
            email = data.get('email')
            role = data.get('role')
            cursor.execute("UPDATE users SET username=?, email=?, role=? WHERE id=?", (username, email, role, user_id))
            log_action("Edit User Details", "system_admin", f"Updated user ID {user_id} details")
            
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
        
    elif request.method == 'DELETE':
        user_id = request.args.get('id')
        cursor.execute("DELETE FROM users WHERE id=?", (user_id,))
        log_action("Delete User", "system_admin", f"Deleted user ID {user_id}")
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200

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
    
    risk_level, risk_memo = ai_rms_assess(commodity_desc)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO inspections (
            bill_of_lading, origin_port, cargo_type, weight, image_url, 
            risk_level, status, inspector_email, assigned_risk_level, inspection_summary,
            vessel_imo, vessel_name, country_of_origin, gross_tonnage, rms_risk_level, rms_analysis_memo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        bill_of_lading, country_of_origin, commodity_desc, gross_tonnage, '', 
        risk_level, 'Awaiting Physical Inspection', inspector_email, risk_level, risk_memo,
        vessel_imo, vessel_name, country_of_origin, gross_tonnage, risk_level, risk_memo
    ))
    
    inspection_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    log_action("Register Manifest", "inspector", f"B/L {bill_of_lading} submitted for Vessel {vessel_name}")
    return jsonify({
        "id": inspection_id, 
        "rms_risk_level": risk_level, 
        "rms_analysis_memo": risk_memo, 
        "status": "Awaiting Physical Inspection"
    }), 200

@app.route('/api/clearance/verify', methods=['GET'])
def verify_clearance_api():
    token = request.args.get('token')
    if not token:
        return jsonify({"status": "error", "message": "Missing verification token."}), 400
        
    conn = get_db()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inspections WHERE qr_token=?", (token,))
    r = cursor.fetchone()
    conn.close()
    
    if not r:
        return jsonify({"status": "error", "message": "Clearance certificate not found or invalid."}), 404
        
    return jsonify({
        "id": r["id"], 
        "bill_of_lading": r["bill_of_lading"], 
        "origin_port": r["origin_port"], 
        "cargo_type": r["cargo_type"], 
        "weight": r["weight"], 
        "risk_level": r["risk_level"], 
        "status": r["status"], 
        "notes": r["notes"],
        "date": r["timestamp"],
        "actual_weight": r["actual_weight"],
        "seal_intact": bool(r["seal_intact"]) if r["seal_intact"] is not None else None,
        "structural_damage": bool(r["structural_damage"]) if r["structural_damage"] is not None else None,
        "qr_token": r["qr_token"],
        "assigned_risk_level": r["assigned_risk_level"],
        "inspection_summary": r["inspection_summary"],
        "vessel_imo": r["vessel_imo"],
        "vessel_name": r["vessel_name"],
        "country_of_origin": r["country_of_origin"],
        "gross_tonnage": r["gross_tonnage"] if r["gross_tonnage"] is not None else r["weight"],
        "rms_risk_level": r["rms_risk_level"] if r["rms_risk_level"] is not None else r["assigned_risk_level"],
        "rms_analysis_memo": r["rms_analysis_memo"] if r["rms_analysis_memo"] is not None else r["inspection_summary"]
    }), 200

@app.route('/api/inspections', methods=['GET'])
def get_inspections():
    inspector_email = request.args.get('inspectorEmail')
    conn = get_db()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if inspector_email:
        cursor.execute('SELECT * FROM inspections WHERE inspector_email=? ORDER BY id DESC', (inspector_email,))
    else:
        cursor.execute('SELECT * FROM inspections ORDER BY id DESC')
        
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "id": r["id"], 
            "bill_of_lading": r["bill_of_lading"], 
            "origin_port": r["origin_port"], 
            "cargo_type": r["cargo_type"], 
            "weight": r["weight"], 
            "image_url": r["image_url"], 
            "risk_level": r["risk_level"], 
            "status": r["status"], 
            "notes": r["notes"],
            "inspector_email": r["inspector_email"], 
            "date": r["timestamp"],
            "actual_weight": r["actual_weight"],
            "seal_intact": bool(r["seal_intact"]) if r["seal_intact"] is not None else None,
            "structural_damage": bool(r["structural_damage"]) if r["structural_damage"] is not None else None,
            "qr_token": r["qr_token"],
            "assigned_risk_level": r["assigned_risk_level"] if "assigned_risk_level" in r.keys() else None,
            "inspection_summary": r["inspection_summary"] if "inspection_summary" in r.keys() else None,
            "vessel_imo": r["vessel_imo"] if "vessel_imo" in r.keys() else None,
            "vessel_name": r["vessel_name"] if "vessel_name" in r.keys() else None,
            "country_of_origin": r["country_of_origin"] if "country_of_origin" in r.keys() else None,
            "gross_tonnage": r["gross_tonnage"] if "gross_tonnage" in r.keys() else r["weight"],
            "rms_risk_level": r["rms_risk_level"] if ("rms_risk_level" in r.keys() and r["rms_risk_level"] is not None) else r["assigned_risk_level"],
            "rms_analysis_memo": r["rms_analysis_memo"] if ("rms_analysis_memo" in r.keys() and r["rms_analysis_memo"] is not None) else r["inspection_summary"]
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
    
    conn = get_db()
    cursor = conn.cursor()
    
    if inspection_id:
        cursor.execute('''
            UPDATE inspections 
            SET actual_weight=?, seal_intact=?, structural_damage=?, image_url=?, status='Inspected - Awaiting Authority Adjudication'
            WHERE id=? AND (status='Pending' OR status='Awaiting Physical Inspection')
        ''', (actual_weight, seal_intact, structural_damage, image_url, inspection_id))
    else:
        cursor.execute('''
            UPDATE inspections 
            SET actual_weight=?, seal_intact=?, structural_damage=?, image_url=?, status='Inspected - Awaiting Authority Adjudication'
            WHERE bill_of_lading=? AND (status='Pending' OR status='Awaiting Physical Inspection')
        ''', (actual_weight, seal_intact, structural_damage, image_url, manifest_id))
        
    conn.commit()
    conn.close()
    
    log_action("Inspect Cargo", "inspector", f"BoL {manifest_id or inspection_id} physical inspection completed.")
    return jsonify({"status": "success"}), 200

@app.route('/api/inspections/review', methods=['POST'])
def review_inspection():
    data = request.json
    inspection_id = data.get('id')
    status = data.get('status') # 'Approved', 'Rejected', 'Port Clearance Granted', 'Clearance Denied - Detained for Physical Audit'
    notes = data.get('notes')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Strictly enforce that approved/granted cargo cannot be modified
    cursor.execute("SELECT status FROM inspections WHERE id=?", (inspection_id,))
    row = cursor.fetchone()
    if row and row[0] in ['Approved', 'Port Clearance Granted']:
        conn.close()
        return jsonify({"status": "error", "message": "This cargo/vessel manifest has already been cleared and approved. Decisions are final and cannot be modified."}), 400
        
    qr_token = None
    if status in ['Approved', 'Port Clearance Granted']:
        qr_token = f"NMPA-PCC-{inspection_id}-{random.randint(100000, 999999)}"
        cursor.execute("UPDATE inspections SET status=?, notes=?, qr_token=? WHERE id=?", (status, notes, qr_token, inspection_id))
    elif status == 'Re-Inspect':
        # Re-inspect resets status back to Pending and clears inspector fields
        cursor.execute("UPDATE inspections SET status='Pending', notes=?, actual_weight=NULL, seal_intact=NULL, structural_damage=NULL WHERE id=?", (notes, inspection_id))
    else:
        cursor.execute("UPDATE inspections SET status=?, notes=? WHERE id=?", (status, notes, inspection_id))
    
    # Get inspector email to send notification
    cursor.execute("SELECT inspector_email, bill_of_lading FROM inspections WHERE id=?", (inspection_id,))
    row = cursor.fetchone()
    conn.commit()
    conn.close()
    
    if row:
        inspector_email, bol = row
        subject = f"NMPA Custom Adjudication - {status} - B/L {bol}"
        body = f"The Import General Manifest for Bill of Lading {bol} has been marked as {status} by the Port Authority.\nAdjudication Notes: {notes}"
        send_email_notification(inspector_email, subject, body)
        
    log_action("Review Adjudication", "port_authority", f"Manifest {inspection_id} marked as {status}")
    return jsonify({"status": "success", "qrToken": qr_token}), 200

@app.route('/api/logs', methods=['GET'])
def get_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC")
    logs = [{"id": r[0], "action": r[1], "role": r[2], "details": r[3], "date": r[4]} for r in cursor.fetchall()]
    conn.close()
    return jsonify(logs), 200

@app.route('/api/complaints', methods=['GET', 'POST'])
def handle_complaints():
    conn = get_db()
    cursor = conn.cursor()
    
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
            cursor.execute('''
                INSERT INTO chairman_office_inbox (email, category, description, is_escalated_to_chairman, severity_level)
                VALUES (?, ?, ?, 1, ?)
            ''', (email, subject, message, severity))
            complaint_id = cursor.lastrowid
            conn.commit()
            conn.close()
            log_action("Escalate Complaint", "System", f"Escalated complaint by {email} to Chairman")
            return jsonify({
                "status": "success", 
                "message": "Grievance escalated directly to Chairman.",
                "routed_to": "CHAIRMAN_OFFICE_INBOX",
                "id": complaint_id
            }), 201
        else:
            cursor.execute('''
                INSERT INTO complaints (inspector_email, subject, message, is_escalated_to_chairman, severity_level)
                VALUES (?, ?, ?, 0, ?)
            ''', (email, subject, message, severity))
            complaint_id = cursor.lastrowid
            conn.commit()
            conn.close()
            log_action("Submit Complaint", "System", f"Complaint submitted by {email}")
            return jsonify({
                "status": "success", 
                "message": "Complaint submitted to standard queue.",
                "routed_to": "STANDARD_GRIEVANCE_QUEUE",
                "id": complaint_id
            }), 201
        
    else:
        cursor.execute("SELECT id, inspector_email, subject, message, timestamp, is_escalated_to_chairman, severity_level FROM complaints ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for r in rows:
            result.append({
                "id": r[0],
                "email": r[1],
                "subject": r[2],
                "message": r[3],
                "date": r[4],
                "is_escalated_to_chairman": bool(r[5]),
                "severity_level": r[6]
            })
        return jsonify(result), 200

@app.route('/api/chairman/complaints', methods=['GET'])
def get_chairman_complaints():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, category, description, severity_level, timestamp FROM chairman_office_inbox ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "id": r[0],
            "email": r[1],
            "subject": r[2],
            "message": r[3],
            "severity_level": r[4],
            "date": r[5],
            "is_escalated_to_chairman": True
        })
    return jsonify(result), 200

if __name__ == '__main__':
    init_db()
    app.run(port=5000, debug=True)
