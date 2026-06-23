import sys
import os
from fpdf import FPDF

class SRS_PDF(FPDF):
    def header(self):
        # Skip header on cover page
        if self.page_no() == 1:
            return
        
        # Top banner band (NMPA Dark Blue)
        self.set_fill_color(13, 43, 94)
        self.rect(0, 0, 210, 12, 'F')
        
        # Header text
        self.set_y(2)
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 8)
        self.cell(w=0, h=8, text="NEW MANGALORE PORT AUTHORITY (NMPA)  |  CARGO INSPECTION SYSTEM v2.0", align='C', new_x="LMARGIN", new_y="NEXT")
        
        # Reset text color and positioning for body
        self.set_text_color(0, 0, 0)
        self.set_y(18)
        
    def footer(self):
        # Skip footer on cover page
        if self.page_no() == 1:
            return
            
        # Draw a line above footer
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.5)
        self.line(15, 282, 195, 282)
        
        # Page number
        self.set_y(-12)
        self.set_text_color(115, 115, 115)
        self.set_font('Helvetica', 'I', 8)
        self.cell(w=0, h=8, text=f"Page {self.page_no()}", align='C', new_x="LMARGIN", new_y="NEXT")
        self.cell(w=0, h=4, text="NMPA IT & Security Compliance Division", align='R', new_x="LMARGIN", new_y="NEXT")

    def add_section_header(self, number, title):
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(13, 43, 94) # NMPA Dark Blue
        self.ln(6)
        self.cell(w=0, h=10, text=f"{number} {title}", new_x="LMARGIN", new_y="NEXT")
        
        # Section horizontal underline
        self.set_draw_color(13, 43, 94)
        self.set_line_width(0.8)
        x_start = self.get_x()
        y_start = self.get_y() - 1.5
        self.line(x_start, y_start, x_start + 180, y_start)
        self.ln(4)

    def add_subsection_header(self, number, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(74, 85, 104) # Slate Blue
        self.ln(4)
        self.cell(w=0, h=8, text=f"{number} {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def add_subsubsection_header(self, number, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(100, 110, 125)
        self.ln(2)
        self.cell(w=0, h=7, text=f"{number} {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def add_paragraph(self, text, indent=0):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(38, 38, 38)
        if indent > 0:
            self.set_x(self.get_x() + indent)
        self.multi_cell(w=180 - indent, h=5, text=text, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def add_bullet_point(self, title, text, indent=8):
        self.set_x(15 + indent)
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(13, 43, 94)
        self.cell(w=4, h=5, text="* ", align='L')
        self.cell(w=self.get_string_width(title) + 1, h=5, text=title, align='L')
        self.set_font('Helvetica', '', 10)
        self.set_text_color(38, 38, 38)
        
        # Calculate width remaining for multi-cell
        x_pos = 15 + indent + 4 + self.get_string_width(title) + 1
        self.set_x(x_pos)
        self.multi_cell(w=195 - x_pos, h=5, text=text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

def generate_pdf():
    pdf = SRS_PDF(orientation='P', unit='mm', format='A4')
    pdf.set_margins(15, 18, 15)
    pdf.add_page()
    
    # ------------------ COVER PAGE ------------------
    pdf.set_fill_color(13, 43, 94)
    # Dark blue cover accent block
    pdf.rect(0, 0, 210, 95, 'F')
    
    # Logo Placeholder / Graphic Accent
    pdf.set_y(25)
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(w=0, h=10, text="N  M  P  A", align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(226, 232, 240)
    pdf.cell(w=0, h=6, text="NEW MANGALORE PORT AUTHORITY", align='C', new_x="LMARGIN", new_y="NEXT")
    
    # Divider line
    pdf.ln(8)
    pdf.set_draw_color(255, 255, 255)
    pdf.set_line_width(1)
    pdf.line(40, 50, 170, 50)
    
    # Cover Document Title
    pdf.set_y(115)
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(13, 43, 94)
    pdf.cell(w=0, h=12, text="SOFTWARE REQUIREMENTS SPECIFICATION", align='C', new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('Helvetica', 'B', 16)
    pdf.set_text_color(74, 85, 104)
    pdf.cell(w=0, h=10, text="Cargo Inspection & Management System", align='C', new_x="LMARGIN", new_y="NEXT")
    pdf.cell(w=0, h=6, text="Version 2.0", align='C', new_x="LMARGIN", new_y="NEXT")
    
    # Decorative line
    pdf.ln(10)
    pdf.set_draw_color(226, 232, 240)
    pdf.set_line_width(0.5)
    pdf.line(20, 160, 190, 160)
    
    # Project details block
    pdf.set_y(180)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(13, 43, 94)
    pdf.cell(w=50, h=6, text="Target Organization:")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(38, 38, 38)
    pdf.cell(w=0, h=6, text="New Mangalore Port Authority (NMPA)", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(13, 43, 94)
    pdf.cell(w=50, h=6, text="Document ID:")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(38, 38, 38)
    pdf.cell(w=0, h=6, text="NMPA-SCIMS-2026-SRS", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(13, 43, 94)
    pdf.cell(w=50, h=6, text="Publish Date:")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(38, 38, 38)
    pdf.cell(w=0, h=6, text="June 1, 2026", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(13, 43, 94)
    pdf.cell(w=50, h=6, text="Status:")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(38, 38, 38)
    pdf.cell(w=0, h=6, text="Final Approved", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(13, 43, 94)
    pdf.cell(w=50, h=6, text="Authors:")
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(38, 38, 38)
    pdf.cell(w=0, h=6, text="NMPA IT Development Cell & Quality Assurance Team", new_x="LMARGIN", new_y="NEXT")
    
    # Footer statement
    pdf.set_y(260)
    pdf.set_font('Helvetica', 'I', 9)
    pdf.set_text_color(115, 115, 115)
    pdf.multi_cell(w=180, h=4.5, text="This document contains proprietary information regarding the security and cargo inspection processes of the New Mangalore Port Authority. Unauthorized distribution or copying is strictly prohibited.", align='C', new_x="LMARGIN", new_y="NEXT")
    
    # ------------------ SECTION 2: SRS ------------------
    pdf.add_page()
    pdf.add_section_header("2.0", "SOFTWARE REQUIREMENTS SPECIFICATION (SRS)")
    pdf.add_paragraph("This section presents the comprehensive Software Requirements Specification (SRS) details for the New Mangalore Port Authority (NMPA) Cargo Inspection & Management System. This system streamlines maritime container processing by integrating automated weighing validation, multi-actor workflow pipelines, AI risk scoring models, and security control audit logs.")
    
    # 2.1 Introduction
    pdf.add_subsection_header("2.1", "Introduction")
    pdf.add_paragraph("The primary objective of this project is to address vulnerabilities in maritime security, optimize land-side gate traffic, and enforce cargo clearance compliance. By replacing fragmented manual spreadsheets with a unified system, port inspectors and approvers can interact in real time with high operational efficiency.")
    
    pdf.add_bullet_point("Purpose: ", "This document specifies the software requirements for v2.0 of the Cargo Inspection System. It provides developers, testing teams, and port authorities with a formal guide mapping out the core workflows, database schemas, API contracts, and user roles.")
    pdf.add_bullet_point("Scope: ", "The system covers a secure frontend client application (built with React/Vite/Antd) and a backend REST API (built with Python/Flask/SQLite). It supports automated weight discrepancies checking, AI-assisted cargo risk categorization, and electronic Gate Pass QR generation.")
    pdf.add_bullet_point("Definitions: ", "NMPA: New Mangalore Port Authority. BoL: Bill of Lading. Gate Pass: Clear-pass ticket printed with QR token. RBAC: Role-Based Access Control. WAL: Write-Ahead Logging (ensuring sqlite transactional reliability).")
    pdf.add_bullet_point("References: ", "IEEE Std 830-1998 (Standard for SRS), NMPA Safety Regulations, and the Cargo Inspection System Design Architecture documentation.")
    pdf.add_bullet_point("Overview: ", "This document details the functional and non-functional requirements, architectural characteristics, user profiles, constraints, system attributes, and special policies of the NMPA software.")
    
    # 2.2 Overall Description
    pdf.add_subsection_header("2.2", "Overall Description")
    
    # 2.2.1 Product perspective
    pdf.add_subsubsection_header("2.2.1", "Product Perspective")
    pdf.add_paragraph("The NMPA Cargo Inspection System operates as an independent web application that interfaces directly with physical port cargo checkposts. It operates within a secure intranational network architecture, communicating over ports 5173 (client) and 5000 (server REST API) with a persistent SQLite storage layer (cargo.db).")
    
    # 2.2.2 Product Functions
    pdf.add_subsubsection_header("2.2.2", "Product Functions")
    pdf.add_paragraph("The system executes five core business processes:")
    pdf.add_bullet_point("User Identity Management: ", "Supports secure multi-role registration, system admin review pipelines, password complexity constraints, and optional Two-Factor Authentication (2FA).")
    pdf.add_bullet_point("Cargo Submission: ", "Allows inspectors to register cargo incoming shipments with Bill of Lading (BoL), origin port, weight (MT), and cargo type.")
    pdf.add_bullet_point("AI Risk Evaluation: ", "Runs deterministic algorithms to check and assign cargo risk parameters (High, Medium, Low) based on port threat levels, cargo chemical classification, and container weight.")
    pdf.add_bullet_point("Physical Check Audit: ", "Enables physical checkers to input scale-verified actual weight, confirm container seal integrity, log structural damage, and upload image evidence.")
    pdf.add_bullet_point("Clearance Approvals: ", "Allows Port Authority officers to review discrepancies between registered and actual manifest, approve/reject cargo, or order re-inspection (which resets cargo states). Approved cargo produces an un-editable digital gate pass.")
    
    # 2.2.3 User characteristics
    pdf.add_subsubsection_header("2.2.3", "User Characteristics")
    pdf.add_paragraph("The system defines three specific user personas, each corresponding to a distinct application route:")
    pdf.add_bullet_point("System Admin: ", "Responsible for user onboarding approval, inline profile edits, system settings configuration (like adjusting the global weight tolerance discrepancy threshold), and reviewing the system audit log ledgers.")
    pdf.add_bullet_point("Port Authority (Approver): ", "Officers with terminal clearance privileges. They examine completed inspections and make final decisions (Approve, Reject, Re-Inspect).")
    pdf.add_bullet_point("Inspector: ", "Frontline operators stationed at physical gates who record container details, perform audits, and submit support complaints to the admin.")
    
    # 2.2.4 General constraints
    pdf.add_subsubsection_header("2.2.4", "General Constraints")
    pdf.add_paragraph("1. Database Constraints: SQLite is used as the transactional layer. To prevent write conflicts under concurrent requests, database connections must use a WAL (Write-Ahead Logging) journal mode and a query timeout of 10 seconds.")
    pdf.add_paragraph("2. Regulatory Compliance: The system must enforce that approved cargo is locked out of further edits or status modifications. Re-inspect operations must reset the container state back to 'Pending' and clear previous inputs.")
    pdf.add_paragraph("3. Network Limitations: The application must function reliably over standard port intranet environments.")
    
    # 2.2.5 Assumptions
    pdf.add_subsubsection_header("2.2.5", "Assumptions")
    pdf.add_paragraph("It is assumed that physical weigh scales are calibrated to report weights in Metric Tons (MT) to a precision of two decimal places. It is also assumed that the system administrator has initialized default accounts (Admin99, Auth99, Inspector99) to bypass initial registration blocks during system boot-up.")
    
    # 2.3 Special Requirements
    pdf.add_page()
    pdf.add_section_header("2.3", "Special Requirements")
    pdf.add_paragraph("The NMPA platform enforces the following special domain requirements:")
    pdf.add_bullet_point("Real-time Log Auditing: ", "Every security-critical operation (Logins, User Registration, Approval, Rejection, Re-Inspection, 2FA modifications) must write to a central audit trail along with client IP metadata.")
    pdf.add_bullet_point("Discrepancy Alerts: ", "If the difference between registered weight and physical weight exceeds the administrator's global tolerance percentage (e.g. 5%), the system must flag a visual warning in the Port Authority dashboard.")
    pdf.add_bullet_point("Automated Notification Dispatch: ", "Upon cargo state transitions (Approved, Rejected, Re-Inspect), a mock email notification must instantly fire to the corresponding inspector notifying them of the Port Authority's feedback.")
    
    # 2.4 Functional requirements
    pdf.add_subsection_header("2.4", "Functional Requirements")
    pdf.add_paragraph("Functional requirements are classified by system API capability:")
    
    pdf.add_bullet_point("Authentication API (/api/login): ", "POST requests authenticate credentials. Updates the 'last_login' timestamp on success. Returns error code 403 if the administrator has not approved the account.")
    pdf.add_bullet_point("User RBAC API (/api/users): ", "GET lists accounts. POST adds profiles, enforcing that passwords have 1 uppercase, 1 lowercase, 1 digit, 1 special character, and are unique across the database. PUT handles user approvals and toggling of 2FA. DELETE revokes login permissions.")
    pdf.add_bullet_point("Evaluation API (/api/evaluate): ", "POST logs a new manifest. Triggers the AI risk scoring engine (Hazardous cargo adds 50 points; high-risk ports add 40 points; weights > 10,000 MT add 15 points). Defaults status to 'Pending'.")
    pdf.add_bullet_point("Inspection API (/api/inspections/inspect): ", "POST records physical checks: actual weight, seal status, structural damage, image link, and changes status to 'Inspected'.")
    pdf.add_bullet_point("Review API (/api/inspections/review): ", "POST reviews the cargo. If status is 'Approved', generates a unique QR gatepass token. Blocks modifications to already approved cargo with 400 Bad Request.")
    pdf.add_bullet_point("Audit Logs API (/api/logs): ", "GET returns full list of system audit actions sorted chronologically in reverse order.")
    pdf.add_bullet_point("Complaints API (/api/complaints): ", "POST saves operator support complaints. GET lists complaints for the System Admin.")
    
    # 2.5 Design Constraints
    pdf.add_subsection_header("2.5", "Design Constraints")
    pdf.add_paragraph("1. Frontend Stack: Must be developed in React 19 using Vite and styled using Ant Design component structures. CSS styling must avoid ad-hoc utility classes in favor of a cohesive theme stylesheet.")
    pdf.add_paragraph("2. Backend Stack: Developed strictly in Python Flask. Must utilize standard libraries like sqlite3 for lightweight transactional integrity without external ORM overhead.")
    pdf.add_paragraph("3. Portability: Code must run cross-platform on Windows systems, operating as background processes via CLI run commands.")
    
    # 2.6 System Attributes
    pdf.add_subsection_header("2.6", "System Attributes")
    pdf.add_bullet_point("Security: ", "Passwords must never be stored or matched in plaintext in production. Username inputs must be at least 4 characters long and contain only alphanumeric characters and underscores.")
    pdf.add_bullet_point("Reliability: ", "Database locks are minimized by PRAGMA journal_mode=WAL; configurations, enabling non-blocking reads during active database write transactions.")
    pdf.add_bullet_point("Performance: ", "API endpoints must resolve search queries and database reads in less than 300 milliseconds under load.")
    pdf.add_bullet_point("Maintainability: ", "The frontend page structure separates distinct RBAC views (SystemAdmin.jsx, PortAuthority.jsx, Dashboard.jsx) into single-responsibility modules.")
    
    # 2.7 Other Requirements
    pdf.add_subsection_header("2.7", "Other Requirements")
    pdf.add_paragraph("1. System Scalability: The database schema must support indexing on high-frequency search fields, such as Bill of Lading (BoL) and Inspector email addresses.")
    pdf.add_paragraph("2. Offline Audit Support: In the event of network disruption, local log outputs should be readable via direct database queries to facilitate manual port clearances.")
    
    # Save the output file
    output_path = os.path.abspath("NMPA_Cargo_Inspection_System_SRS.pdf")
    pdf.output(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == '__main__':
    generate_pdf()
