import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def build_docx_report():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # XML Helper Functions
    def set_table_borders(table, color="CCCCCC", sz="4", val="single"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="{top}" w:type="dxa"/>'
            f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
            f'<w:left w:w="{left}" w:type="dxa"/>'
            f'<w:right w:w="{right}" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

    def set_cell_background(cell, color_hex="F2F4F7"):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        tcPr.append(shd)

    def make_row_header(row):
        trPr = row._tr.get_or_add_trPr()
        tblHeader = parse_xml(f'<w:tblHeader {nsdecls("w")}/>')
        cantSplit = parse_xml(f'<w:cantSplit {nsdecls("w")}/>')
        trPr.append(tblHeader)
        trPr.append(cantSplit)

    def make_row_cant_split(row):
        trPr = row._tr.get_or_add_trPr()
        cantSplit = parse_xml(f'<w:cantSplit {nsdecls("w")}/>')
        trPr.append(cantSplit)

    def clean_text(text):
        if not text:
            return ""
        text = str(text)
        text = text.replace('\u201c', '"').replace('\u201d', '"')
        text = text.replace('\u2018', "'").replace('\u2019', "'")
        text = text.replace('\u2013', '-').replace('\u2014', '-')
        text = text.replace('🚨', '[ALERT]').replace('⏳', '[PENDING]').replace('✅', '[OK]')
        text = text.replace('🔍', '[SEARCH]').replace('⏱️', '[TIMER]').replace('🔒', '[SECURE]')
        text = text.replace('⚠️', '[WARNING]').replace('📝', '[NOTE]')
        text = text.encode('ascii', errors='replace').decode('ascii')
        return text

    def add_heading(text, level):
        clean_txt = clean_text(text)
        p = doc.add_paragraph()
        p.paragraph_format.keep_with_next = True
        
        if level == 1:
            p.paragraph_format.space_before = Pt(22)
            p.paragraph_format.space_after = Pt(8)
            run = p.add_run(clean_txt)
            run.font.name = 'Arial'
            run.font.size = Pt(16)
            run.bold = True
            run.font.color.rgb = RGBColor(0, 51, 102) # Dark Navy
        elif level == 2:
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(5)
            run = p.add_run(clean_txt)
            run.font.name = 'Arial'
            run.font.size = Pt(13)
            run.bold = True
            run.font.color.rgb = RGBColor(0, 51, 102)
        elif level == 3:
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(clean_txt)
            run.font.name = 'Arial'
            run.font.size = Pt(11)
            run.bold = True
            run.font.color.rgb = RGBColor(51, 51, 51)
        return p

    def add_p(text, indent=False, space_after=6):
        clean_txt = clean_text(text)
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.5 # Academic 1.5 line spacing
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.3)
        run = p.add_run(clean_txt)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0, 0, 0)
        return p

    def add_bullet(title, description):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.5
        
        r_title = p.add_run(clean_text(title + ": "))
        r_title.bold = True
        r_title.font.name = 'Times New Roman'
        r_title.font.size = Pt(12)
        
        r_desc = p.add_run(clean_text(description))
        r_desc.font.name = 'Times New Roman'
        r_desc.font.size = Pt(12)
        return p

    def add_ui(img_path, caption_text):
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run()
            run.add_picture(img_path, width=Inches(5.8))
            
            cp = doc.add_paragraph()
            cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            cp.paragraph_format.space_after = Pt(12)
            c_run = cp.add_run(clean_text(caption_text))
            c_run.font.name = 'Arial'
            c_run.font.size = Pt(9.5)
            c_run.italic = True
            c_run.bold = True
            c_run.font.color.rgb = RGBColor(51, 51, 51)
        else:
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(clean_text(f"[ SYSTEM INTERFACE DIAGRAM: {caption_text} ]"))
            run.font.name = 'Arial'
            run.font.size = Pt(10)
            run.bold = True
            run.font.color.rgb = RGBColor(0, 51, 102)

    def add_tbl(col_widths, headers, rows_data):
        table = doc.add_table(rows=len(rows_data)+1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.style = 'Table Grid'
        set_table_borders(table, color="CCCCCC", sz="4")
        
        make_row_header(table.rows[0])
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = clean_text(title)
            set_cell_background(hdr_cells[i], "003366")
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(10)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
                
        for r_idx, row_values in enumerate(rows_data, 1):
            row = table.rows[r_idx]
            make_row_cant_split(row)
            cells = row.cells
            bg_color = "F9FAFC" if r_idx % 2 == 0 else "FFFFFF"
            for c_idx, val in enumerate(row_values):
                cells[c_idx].text = clean_text(str(val))
                set_cell_background(cells[c_idx], bg_color)
                set_cell_margins(cells[c_idx], top=100, bottom=100, left=140, right=140)
                p = cells[c_idx].paragraphs[0]
                if c_idx == 0 and len(row_values) > 3:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(10)
                    r.font.color.rgb = RGBColor(0, 0, 0)
                    
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

    # ------------------ COVER PAGE ------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(36)
    p_title.paragraph_format.space_after = Pt(12)
    r_t = p_title.add_run("NEW MANGALORE PORT AUTHORITY (NMPA)\nCARGO INSPECTION AND AI RISK MANAGEMENT SYSTEM")
    r_t.font.name = 'Arial'
    r_t.font.size = Pt(20)
    r_t.bold = True
    r_t.font.color.rgb = RGBColor(0, 51, 102)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(36)
    r_sub = p_sub.add_run("A Project Report Submitted in Partial Fulfillment of the Requirements\nfor the Degree of Bachelor of Engineering / Technology in\nComputer Science & Engineering")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(13)
    r_sub.italic = True

    logo_path = r"c:\NMPA final project\frontend\public\nmpa-logo.png"
    if os.path.exists(logo_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(36)
        p_img.add_run().add_picture(logo_path, width=Inches(2.2))

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(12)
    r_m = p_meta.add_run("NEW MANGALORE PORT AUTHORITY (NMPA)\nPANAMBUR, MANGALURU - 575010, KARNATAKA, INDIA\n\nAcademic Session: 2025 - 2026")
    r_m.font.name = 'Times New Roman'
    r_m.font.size = Pt(12)
    r_m.bold = True

    doc.add_page_break()

    # ------------------ INDEX PAGE ------------------
    add_heading("INDEX PAGE", 1)
    add_p("The table below delineates the structural layout, chapter topics, figure references, table indices, and corresponding page allocations across this academic project report.")

    headers_index = ["System Topic / Figure / Table Index", "Page No."]
    col_w_index = [5.2, 1.3]
    
    rows_index = [
        ["Abstract", "Unnumbered"],
        ["Chapter 1: Synopsis & Introduction", "1"],
        ["1.1 Introduction of the System", "1"],
        ["1.1.1 Project Title", "1"],
        ["1.1.2 Category", "2"],
        ["1.1.3 Overview", "3"],
        ["1.1.4 Comparable Port Systems Analysis", "4"],
        ["1.2 Background", "5"],
        ["1.2.1 Introduction of New Mangalore Port Authority (NMPA)", "5"],
        ["1.2.2 Port Infrastructure & Cargo Operational Load", "6"],
        ["1.2.3 Agile Development Approach", "7"],
        ["1.3 Objectives of the System", "8"],
        ["1.4 Scope of the System", "9"],
        ["1.5 Structure of the System", "10"],
        ["1.6 System Architecture Overview (Figure 1.1)", "11"],
        ["1.7 End User Roles & Responsibilities", "12"],
        ["1.8 Software/Hardware Used for Development (Table 1.1)", "13"],
        ["1.9 Software/Hardware Required for Implementation (Table 1.2)", "14"],
        ["Chapter 2: Software Requirements Specification (SRS)", "15"],
        ["2.1 Introduction", "15"],
        ["2.1.1 Purpose", "15"],
        ["2.1.2 Scope", "16"],
        ["2.1.3 Definitions, Acronyms and Abbreviations", "17"],
        ["2.1.4 Regulatory Frameworks & Maritime Compliance References", "18"],
        ["2.2 Overall Description", "19"],
        ["2.2.1 Product Perspective", "19"],
        ["2.2.2 Product Functions", "20"],
        ["2.2.3 User Characteristics", "21"],
        ["2.2.4 General Constraints", "22"],
        ["2.2.5 Assumptions & Dependencies", "23"],
        ["2.3 Special Requirements (Bilingual UI, Dark/Light Mode, Local Storage Sync)", "24"],
        ["2.4 Functional Requirements (Table 2.1)", "25"],
        ["2.4.1 User Authentication & Role Administration", "25"],
        ["2.4.2 Import General Manifest (IGM) & Cargo Logging", "26"],
        ["2.4.3 AI Risk Management System (RMS) Threat Classification Engine", "27"],
        ["2.4.4 Weighbridge Physical Check & Tolerance Verification", "28"],
        ["2.4.5 Port Authority Clearance Adjudication & QR Gate Pass Generation", "29"],
        ["2.4.6 Public QR Verification Registry & Grievance Portal", "30"],
        ["2.5 Design Constraints & Data Standards", "31"],
        ["2.6 System Attributes (Reliability, Scalability, Security)", "32"],
        ["2.7 Other Requirements (Table 2.2)", "33"],
        ["Chapter 3: System Design & Architecture", "34"],
        ["3.1 Architectural Decomposition & Layered Design (Figure 3.1)", "34"],
        ["3.2 System Assumptions and Constraints", "35"],
        ["3.3 Functional Decomposition Breakdown", "36"],
        ["3.4 Description of Programs & Process Flow", "37"],
        ["3.4.1 Context Flow Diagram CFD (Figure 3.2)", "37"],
        ["3.4.2 Level 0 DFD - Overall System Data Flow (Figure 3.3)", "38"],
        ["3.4.3 Level 1 DFD - AI RMS Threat Evaluation Pipeline (Figure 3.4)", "39"],
        ["3.4.4 Level 2 DFD - Weighbridge Check & Authority Adjudication (Figure 3.5)", "40"],
        ["3.4.5 State Machine Diagram - Cargo Clearance Pipeline (Figure 3.6)", "41"],
        ["Chapter 4: Database Design & Entity Schemes", "42"],
        ["4.1 Introduction & Database Selection (SQLite / MongoDB)", "42"],
        ["4.2 Purpose and Scope", "43"],
        ["4.3 Table Definitions & Schemas (Tables 4.1, 4.2, 4.3, 4.4, 4.5)", "44"],
        ["4.3.1 Users Table Schema (users)", "44"],
        ["4.3.2 Cargo Manifests Table Schema (manifests)", "45"],
        ["4.3.3 Weighbridge Physical Checks Table Schema (inspections)", "46"],
        ["4.3.4 Public Grievances Table Schema (grievances)", "47"],
        ["4.3.5 Security Audit Trail Table Schema (audit_logs)", "48"],
        ["4.4 Entity-Relationship (ER) Diagram (Figure 4.1)", "49"],
        ["Chapter 5: Detailed Design & Program Logic", "50"],
        ["5.1 Structure of the Software Package", "50"],
        ["5.2 Core Module Implementation", "51"],
        ["5.2.1 Authentication & Session Security (JWT, Bcrypt)", "51"],
        ["5.2.2 AI Risk Management System (RMS) Keyword Classifier", "52"],
        ["5.2.3 Weighbridge Scale Verification & Discrepancy Tolerance Engine", "53"],
        ["5.2.4 Port Authority Clearance Adjudication Console", "54"],
        ["5.2.5 Cryptographic QR Gate Pass Generator & Verification Portal", "55"],
        ["5.2.6 Public Grievance Redressal Portal & Chairman's Inbox", "56"],
        ["5.3 User Interface Gallery & Console Screenshots (Figures 5.1 - 5.6)", "57"],
        ["5.3.1 Frontline Inspector IGM Registration Screen (Figure 5.1)", "57"],
        ["5.3.2 AI RMS Threat Tier Notification Panel (Figure 5.2)", "58"],
        ["5.3.3 Weighbridge Inspection & Weight Variance Screen (Figure 5.3)", "59"],
        ["5.3.4 Port Authority Clearance Adjudication Dashboard (Figure 5.4)", "60"],
        ["5.3.5 QR Gate Pass Public Verification Portal (Figure 5.5)", "61"],
        ["5.3.6 Grievance Submission Portal & Chairman Office Queue (Figure 5.6)", "62"],
        ["Chapter 6: User Operations Manual & Guidelines", "63"],
        ["6.1 System Administrator Operations Manual", "63"],
        ["6.2 Frontline Port Inspector Operations Manual", "64"],
        ["6.3 Senior Port Authority Adjudication Manual", "65"],
        ["6.4 Public User & Grievance Portal Manual", "66"],
        ["Chapter 7: Testing and Quality Assurance", "67"],
        ["7.1 Testing Methodology & Strategy", "67"],
        ["7.1.1 Unit Testing (API Endpoints & RMS Logic)", "67"],
        ["7.1.2 Integration Testing (Weighbridge & Authority Flow)", "68"],
        ["7.1.3 System Workflow & Security Testing", "69"],
        ["7.2 Comprehensive Test Reports & Matrix (Tables 7.1, 7.2, 7.3, 7.4)", "70"],
        ["Chapter 8: Results, Discussion & Performance Benchmarks (Table 8.1)", "74"],
        ["Chapter 9: Conclusion & Scope for Future Enhancements", "77"],
        ["9.1 Conclusion", "77"],
        ["9.2 Operational Limitations", "78"],
        ["9.3 Scope for Future Enhancements", "79"],
        ["Abbreviations and Acronyms", "81"],
        ["Appendix A: NMPA Port Operations & Compliance Guidelines", "82"],
        ["Appendix B: Architectural Workflow Specifications & Component Diagrams", "84"],
        ["Bibliography", "120"]
    ]
    add_tbl(col_w_index, headers_index, rows_index)

    doc.add_page_break()

    # ------------------ ABSTRACT ------------------
    add_heading("ABSTRACT", 1)
    add_p("The maritime port sector serves as the vital gateway for international commerce and logistics, where rapid, secure, and compliant cargo clearance is essential to maximize port operational throughput and prevent anchorage congestion. At the New Mangalore Port Authority (NMPA) situated in Panambur, Mangaluru, managing substantial annual vessel and cargo volume requires transitioning away from traditional, labor-intensive paper-reliant inspection workflows. Manual processing, unverified container weight declarations, and subjective risk evaluations introduce vulnerabilities such as revenue leakage, security threats, weight fraud, and prolonged vessel turnaround times.")
    
    add_p("To resolve these operational challenges, this academic project report presents the complete design, software architecture, implementation, and operational deployment of the New Mangalore Port Authority (NMPA) Cargo Inspection and AI Risk Management System. The platform establishes a centralized digital governance portal that automates Import General Manifest (IGM) registration, real-time weighbridge physical verification, artificial intelligence threat profiling, senior port authority adjudication, and tamper-evident QR Code gate pass generation.")

    add_p("The core innovation of the system lies in its integrated AI Risk Management System (RMS), driven by a deterministic Natural Language Processing (NLP) classification engine. Upon manifest entry by frontline port inspectors, the AI engine dynamically categorizes incoming cargo descriptions into three threat tiers: Tier 1 Critical Risk (Red Tag) for volatile energy fuels, chemicals, and bulk minerals requiring mandatory regulatory auditing; Tier 2 Elevated Risk (Yellow Tag) for perishable agricultural commodities such as cashews and coffee or high-tariff electronics requiring phytosanitary and tax validation; and Tier 3 Routine Risk (Green Tag) for standard general cargo. Additionally, the platform automates physical weighbridge validation by cross-referencing declared container tonnage against actual scale measurements, triggering automated warnings whenever weight discrepancies exceed administrator-defined tolerance thresholds.")

    add_p("Architecturally built using a modern full-stack web architecture comprising a React.js single-page frontend (built with Vite) and a Node.js/Express.js RESTful API backend integrated with SQLite storage (cargo.db), the system enforces strict Role-Based Access Control (RBAC) across System Administrators, Port Inspectors, and Senior Port Authorities. Upon clearance adjudication by the Port Authority, the system issues a cryptographically verifiable digital QR Gate Pass for public security gate verification. Furthermore, a dedicated Public Grievance Redressal portal enables port operators and stakeholders to submit operational feedback directly to the NMPA Chairman's Office.")

    add_p("Systematic workflow verification and end-to-end testing demonstrate that the NMPA Cargo Inspection System successfully eliminates paperwork bottlenecks, standardizes cargo threat profiling, mitigates weight discrepancy risks, and drastically reduces cargo clearance processing times, establishing a modernized digital standard for port authority operations.")

    add_bullet("Keywords", "Cargo Inspection System, AI Risk Management System (RMS), Natural Language Processing (NLP), New Mangalore Port Authority (NMPA), Weighbridge Verification, QR Gate Pass, Role-Based Access Control (RBAC), Full-Stack Web Development, React.js, Node.js, Express.js, SQLite.")

    doc.add_page_break()

    # ------------------ CHAPTER 1 ------------------
    add_heading("Chapter 1: Synopsis & Introduction", 1)
    
    add_heading("1.1 Introduction of the System", 2)
    add_p("The maritime transport industry represents the economic lifeline of global commerce, facilitating the transit of more than 80% of world trade volume and over 70% of global trade value. Seaports serve as primary intermodal hubs where maritime shipping lanes converge with inland logistics networks, rail corridors, and highway infrastructure. In an era marked by expanding vessel capacities, containerization, and stringent international maritime security protocols, port administrative efficiency directly dictates regional trade competitiveness, supply chain resilience, and national economic productivity.")
    add_p("Despite rapid advancements in global logistics technologies, many seaport authorities across developing economies continue to operate within legacy administrative paradigms characterized by paper-intensive, fragmented clearance procedures. The vessel clearance process-a statutory prerequisite granting commercial ships legal permission to enter harbor waters, berth at designated quays, load or discharge cargo, and depart-has historically required multi-departmental physical document routing. Arriving merchant vessels must satisfy rigorous regulatory inspections enforced by distinct governmental bodies, including maritime health biosecurity, border control and customs tariffs, and harbor marine traffic navigation.")

    add_heading("1.1.1 Project Title", 3)
    add_p("The official institutional title of this engineering initiative is the 'New Mangalore Port Authority (NMPA) Cargo Inspection and AI Risk Management System' (designated internally in codebase repositories as NMPA-CIS / NexaPort). This moniker reflects its role as the next-generation digital clearance engine engineered specifically for NMPA's operational workflows at Panambur, Mangaluru.")

    add_heading("1.1.2 Category", 3)
    add_p("NMPA-CIS is formally categorized under Enterprise Web Applications, Workflow Automation Systems, and Maritime Logistics Infrastructure. It represents a mission-critical, multi-tenant enterprise portal coordinating complex inter-departmental approval workflows under strict security constraints.")

    add_heading("1.1.3 Overview", 3)
    add_p("The system operates as a central digital nexus coordinating four primary stakeholder groups: System Administrators, Frontline Port Inspectors, Senior Port Authorities, and Public Stakeholders. The operational life cycle proceeds through a structured, automated pipeline:")
    add_bullet("1. Import General Manifest (IGM) Logging", "Frontline port inspectors record incoming vessel manifest data including Bill of Lading identifiers, container numbers, declared cargo tonnage, origin port, and commodity descriptions.")
    add_bullet("2. AI Risk Management System (RMS) Evaluation", "The integrated NLP classifier dynamically assigns cargo threat tags: Tier 1 Critical Risk (Red Tag) for volatile energy fuels/minerals, Tier 2 Elevated Risk (Yellow Tag) for perishable cashews/coffee and high-tariff electronics, and Tier 3 Routine Risk (Green Tag) for general cargo.")
    add_bullet("3. Weighbridge Physical Verification", "Scale operators record physical container weights. The system calculates weight variance against declared manifest tonnage, triggering automated alerts if discrepancies exceed the admin's global tolerance limit.")
    add_bullet("4. Port Authority Adjudication", "Senior officials review RMS threat memos and weight variance alerts, executing Approve (generating cryptographic QR Gate Passes), Reject (detaining cargo), or Re-Inspect (resetting status to Pending) decisions.")
    add_bullet("5. Public QR Validation & Grievance Portal", "Security gates scan QR Gate Passes for authenticity, while stakeholders submit grievances directly to the NMPA Chairman's Office Console.")

    add_heading("1.1.4 Comparable Port Systems Analysis", 3)
    add_p("To ensure alignment with international maritime single-window benchmarks, NMPA-CIS was benchmarked against existing global logistics portals including the Sagar Setu National Logistics Portal (India), CrimsonLogic Portnet (Singapore), and PortBase (Rotterdam). Unlike generic enterprise portals, NMPA-CIS integrates real-time weighbridge scale verification directly with automated AI threat classification, providing localized port security and fraud mitigation.")

    add_heading("1.2 Background", 2)
    add_p("The legacy vessel clearance framework at Panambur harbor relied on manual paper file movement across geographically dispersed administrative offices. Shipping agents spent hours traveling between inspection gates, customs desks, and harbor master terminals. Physical document bottlenecks caused severe vessel turnaround delays, reaching 18 to 24 hours per ship and resulting in thousands of dollars in demurrage costs.")

    add_heading("1.2.1 Introduction of New Mangalore Port Authority (NMPA)", 3)
    add_p("Established in 1974 at Panambur, Mangaluru, the New Mangalore Port Authority (NMPA) is Karnataka's sole major seaport and one of India's 12 premier deep-water ports governed by the Ministry of Ports, Shipping and Waterways. Operating 14 active deep-water berths, NMPA processes over 50 million metric tonnes of annual cargo, including crude oil, LPG, LNG, iron ore, coal, fertilizers, and agricultural commodities like cashews and coffee.")

    add_heading("1.2.2 Port Infrastructure & Cargo Operational Load", 3)
    add_p("NMPA operates heavy physical infrastructure including mechanized bulk handling quays, container freight stations, electronic weighbridge gates, and hazardous material storage yards. Digitizing operational checkpoints bridges physical scale checks with central authority adjudication.")

    add_heading("1.2.3 Agile Development Approach", 3)
    add_p("The software was developed using an iterative Agile Software Development Life Cycle (SDLC) across 5 focused sprint cycles: Sprint 1 (Requirements & DB Schema), Sprint 2 (Auth & RBAC), Sprint 3 (AI RMS & Weighbridge Logic), Sprint 4 (Authority Console & QR Pass Generator), and Sprint 5 (QA Testing & Security Audit).")

    add_heading("1.3 Objectives of the System", 2)
    add_bullet("Primary Objective 1", "Automate paperless single-window cargo clearance for NMPA Mangaluru.")
    add_bullet("Primary Objective 2", "Reduce vessel clearance turnaround times from 18-24 hours down to under 45 minutes.")
    add_bullet("Primary Objective 3", "Incorporate deterministic AI Risk Management (RMS) threat profiling for hazardous and high-tariff cargo.")
    add_bullet("Primary Objective 4", "Implement automated weighbridge scale discrepancy detection and cryptographic QR Gate Pass generation.")
    add_bullet("Secondary Objective 1", "Provide offline data persistence via LocalStorage sync adapters during gate network dropouts.")
    add_bullet("Secondary Objective 2", "Establish a public Grievance Redressal portal with 72-hour SLA tracking and direct escalation to the Chairman's Office.")

    add_heading("1.4 Scope of the System", 2)
    add_p("In-scope capabilities include role-based account onboarding, IGM manifest logging, AI threat profiling, weighbridge verification, Port Authority adjudication, QR gate pass verification, public grievance tracking, and security audit logging. Out-of-scope items for the initial release include direct payment gateway processing and native mobile binary builds.")

    add_heading("1.5 Structure of the System", 2)
    add_p("The system is structured into four distinct actor profiles: System Administrator (configures tolerance thresholds and manages user accounts), Port Inspector (logs IGM manifests and weighbridge scale readings), Port Authority (adjudicates clearances and generates QR passes), and Public Users (verify QR passes and submit grievances).")

    add_heading("1.6 System Architecture Overview (Figure 1.1)", 2)
    add_p("Figure 1.1 illustrates the architectural layout connecting the React SPA presentation layer, REST API controller middleware, SQLite database engine, and external public verification endpoints.")
    bg_img = r"c:\NMPA final project\frontend\public\port-bg.png"
    add_ui(bg_img, "Figure 1.1: Single-Window Clearance Portal Architectural Entry Point & Port Overview")

    add_heading("1.7 End User Roles & Responsibilities", 2)
    add_p("Each user role is strictly partitioned via Role-Based Access Control (RBAC). System Administrators oversee global threshold limits and account approvals; Inspectors manage physical weighbridge scale logs; Port Authorities execute clear/reject decisions; and Public users access verification and grievance features.")

    add_heading("1.8 Software/Hardware Used for Development (Table 1.1)", 2)
    headers_t11 = ["Component", "Specification", "Version / Tool", "Purpose"]
    widths_t11 = [1.5, 1.8, 1.2, 2.0]
    rows_t11 = [
        ["Operating System", "Windows 11 Enterprise", "64-bit OS", "Development Host Platform"],
        ["Frontend Framework", "React.js SPA", "v18.3", "User Interface Presentation"],
        ["Build Tool", "Vite", "v5.4", "Frontend Compilation & HMR"],
        ["Backend Runtime", "Node.js / Express.js", "v20.x", "RESTful API Server Tier"],
        ["Database Engine", "SQLite / MongoDB", "v3.45 WAL", "Relational Data Storage"],
        ["Styling Framework", "Vanilla CSS / Ant Design", "v5.x", "UI Component Layouts"],
        ["Authentication", "JWT & Bcrypt", "jsonwebtoken", "Session Security & Password Hashing"]
    ]
    add_tbl(widths_t11, headers_t11, rows_t11)

    add_heading("1.9 Software/Hardware Required for Implementation (Table 1.2)", 2)
    headers_t12 = ["Resource", "Minimum Requirement", "Recommended Spec", "Target Environment"]
    widths_t12 = [1.4, 1.6, 1.8, 1.7]
    rows_t12 = [
        ["Server CPU", "4 Cores x86_64", "8 Cores 3.2 GHz", "NMPA On-Premise Data Center"],
        ["Server RAM", "8 GB DDR4", "16 GB DDR4", "Production REST Server"],
        ["Storage", "100 GB SSD", "500 GB NVMe SSD", "SQLite WAL Data Storage"],
        ["Network", "100 Mbps Ethernet", "1 Gbps Fiber", "Intranet & Public Gateways"],
        ["Client Device", "Dual-Core PC / Tablet", "Core i5 / Modern Tablet", "Inspector Gate Terminals"],
        ["Browser", "Chrome / Edge v100+", "Chrome v120+ / Edge", "Client Presentation Layer"]
    ]
    add_tbl(widths_t12, headers_t12, rows_t12)

    doc.add_page_break()

    # Save document
    out_file = os.path.abspath("NMPA_Project_Report_Final.docx")
    doc.save(out_file)
    print(f"Successfully saved base document: {out_file}")

if __name__ == '__main__':
    build_docx_report()
