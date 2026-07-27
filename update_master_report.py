import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import glob

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

def set_table_borders(table, color="000000", sz="4", val="single"):
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

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
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

def add_styled_heading(doc, text, level):
    clean_txt = clean_text(text)
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    
    if level == 1:
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(clean_txt)
        run.font.name = 'Arial'
        run.font.size = Pt(16)
        run.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
    elif level == 2:
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(clean_txt)
        run.font.name = 'Arial'
        run.font.size = Pt(13)
        run.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
    elif level == 3:
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(clean_txt)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.bold = True
        run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_styled_paragraph(doc, text, indent=False):
    clean_txt = clean_text(text)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.5
    if indent:
        p.paragraph_format.first_line_indent = Inches(0.4)
    run = p.add_run(clean_txt)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_styled_bullet(doc, title, text):
    clean_title = clean_text(title)
    clean_txt = clean_text(text)
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.5
    
    if clean_title:
        r_title = p.add_run(clean_title + " ")
        r_title.bold = True
        r_title.font.name = 'Times New Roman'
        r_title.font.size = Pt(12)
        r_title.font.color.rgb = RGBColor(0, 0, 0)
        
    r_text = p.add_run(clean_txt)
    r_text.font.name = 'Times New Roman'
    r_text.font.size = Pt(12)
    r_text.font.color.rgb = RGBColor(0, 0, 0)
    return p

def add_code_block(doc, filename, code_lines):
    p_title = doc.add_paragraph()
    p_title.paragraph_format.keep_with_next = True
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(2)
    run_title = p_title.add_run(f"Source Code: {filename}")
    run_title.bold = True
    run_title.font.name = 'Arial'
    run_title.font.size = Pt(10)
    run_title.font.color.rgb = RGBColor(0, 0, 0)

    chunk_size = 150
    for chunk_start in range(0, len(code_lines), chunk_size):
        chunk_lines = code_lines[chunk_start:chunk_start+chunk_size]
        formatted_chunk = []
        for idx, line in enumerate(chunk_lines):
            line_num = chunk_start + idx + 1
            formatted_line = f"{line_num:04d}: {line.replace('\t', '    ').rstrip()}"
            if len(formatted_line) > 105:
                formatted_line = formatted_line[:102] + "..."
            formatted_chunk.append(formatted_line)
            
        p_code = doc.add_paragraph()
        p_code.paragraph_format.space_before = Pt(0)
        p_code.paragraph_format.space_after = Pt(2)
        p_code.paragraph_format.line_spacing = 1.0
        
        run_code = p_code.add_run("\n".join(formatted_chunk))
        run_code.font.name = 'Courier New'
        run_code.font.size = Pt(8.5)
        run_code.font.color.rgb = RGBColor(0, 0, 0)

def add_ui_screenshot(doc, img_path, caption_text):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(10)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(5.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        
        run_cap = p_cap.add_run(clean_text(caption_text))
        run_cap.italic = True
        run_cap.font.name = 'Times New Roman'
        run_cap.font.size = Pt(9.5)
        run_cap.font.color.rgb = RGBColor(0, 0, 0)
    else:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(f"[{clean_text(caption_text)} - Interface Capture Archive]")
        run.bold = True
        run.font.name = 'Arial'
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0, 0, 0)

def add_schema_table(doc, headers, rows):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table, color="000000", sz="4", val="single")
    
    hdr_cells = table.rows[0].cells
    make_row_header(table.rows[0])
    for idx, h in enumerate(headers):
        hdr_cells[idx].paragraphs[0].text = clean_text(h)
        hdr_cells[idx].paragraphs[0].runs[0].font.bold = True
        hdr_cells[idx].paragraphs[0].runs[0].font.name = 'Times New Roman'
        hdr_cells[idx].paragraphs[0].runs[0].font.size = Pt(11)
        set_cell_margins(hdr_cells[idx], top=100, bottom=100, left=120, right=120)
        
    for r_data in rows:
        row = table.add_row()
        make_row_cant_split(row)
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            cell.paragraphs[0].text = clean_text(str(val))
            cell.paragraphs[0].runs[0].font.name = 'Times New Roman'
            cell.paragraphs[0].runs[0].font.size = Pt(10.5)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

index_items = [
    ("Abstract", "Unnumbered"),
    ("Chapter 1: Synopsis & Introduction", "1"),
    ("1.1 Introduction of the System", "1"),
    ("1.1.1 Project Title", "1"),
    ("1.1.2 Category", "2"),
    ("1.1.3 Overview", "3"),
    ("1.1.4 Comparable Port Systems Analysis", "4"),
    ("1.2 Background", "5"),
    ("1.2.1 Introduction of New Mangalore Port Authority (NMPA)", "5"),
    ("1.2.2 Port Infrastructure & Cargo Operational Load", "6"),
    ("1.2.3 Agile Development Approach", "7"),
    ("1.3 Objectives of the System", "8"),
    ("1.4 Scope of the System", "9"),
    ("1.5 Structure of the System", "10"),
    ("1.6 System Architecture Overview (Figure 1.1)", "11"),
    ("1.7 End User Roles & Responsibilities", "12"),
    ("1.8 Software/Hardware Used for Development (Table 1.1)", "13"),
    ("1.9 Software/Hardware Required for Implementation (Table 1.2)", "14"),
    ("Chapter 2: Software Requirements Specification (SRS)", "15"),
    ("2.1 Introduction", "15"),
    ("2.1.1 Purpose", "15"),
    ("2.1.2 Scope", "16"),
    ("2.1.3 Definitions, Acronyms and Abbreviations", "17"),
    ("2.1.4 Regulatory Frameworks & Maritime Compliance References", "18"),
    ("2.2 Overall Description", "19"),
    ("2.2.1 Product Perspective", "19"),
    ("2.2.2 Product Functions", "20"),
    ("2.2.3 User Characteristics", "21"),
    ("2.2.4 General Constraints", "22"),
    ("2.2.5 Assumptions & Dependencies", "23"),
    ("2.3 Special Requirements (Bilingual UI, Dark/Light Mode, Local Storage Sync)", "24"),
    ("2.4 Functional Requirements (Table 2.1)", "25"),
    ("2.4.1 User Authentication & Role Administration", "25"),
    ("2.4.2 Import General Manifest (IGM) & Cargo Logging", "26"),
    ("2.4.3 AI Risk Management System (RMS) Threat Classification Engine", "27"),
    ("2.4.4 Weighbridge Physical Check & Tolerance Verification", "28"),
    ("2.4.5 Port Authority Clearance Adjudication & QR Gate Pass Generation", "29"),
    ("2.4.6 Public QR Verification Registry & Grievance Portal", "30"),
    ("2.5 Design Constraints & Data Standards", "31"),
    ("2.6 System Attributes (Reliability, Scalability, Security)", "32"),
    ("2.7 Other Requirements (Table 2.2)", "33"),
    ("Chapter 3: System Design & Architecture", "34"),
    ("3.1 Architectural Decomposition & Layered Design (Figure 3.1)", "34"),
    ("3.2 System Assumptions and Constraints", "35"),
    ("3.3 Functional Decomposition Breakdown", "36"),
    ("3.4 Description of Programs & Process Flow", "37"),
    ("3.4.1 Context Flow Diagram CFD (Figure 3.2)", "37"),
    ("3.4.2 Level 0 DFD - Overall System Data Flow (Figure 3.3)", "38"),
    ("3.4.3 Level 1 DFD - AI RMS Threat Evaluation Pipeline (Figure 3.4)", "39"),
    ("3.4.4 Level 2 DFD - Weighbridge Check & Authority Adjudication (Figure 3.5)", "40"),
    ("3.4.5 State Machine Diagram - Cargo Clearance Pipeline (Figure 3.6)", "41"),
    ("Chapter 4: Database Design & Entity Schemes", "42"),
    ("4.1 Introduction & Database Selection (SQLite / MongoDB)", "42"),
    ("4.2 Purpose and Scope", "43"),
    ("4.3 Table Definitions & Schemas (Tables 4.1, 4.2, 4.3, 4.4)", "44"),
    ("4.3.1 Users Table Schema (users)", "44"),
    ("4.3.2 Cargo Manifests Table Schema (manifests)", "45"),
    ("4.3.3 Weighbridge Physical Checks Table Schema (inspections)", "46"),
    ("4.3.4 Public Grievances Table Schema (grievances)", "47"),
    ("4.3.5 Security Audit Trail Table Schema (audit_logs)", "48"),
    ("4.4 Entity-Relationship (ER) Diagram (Figure 4.1)", "49"),
    ("Chapter 5: Detailed Design & Program Logic", "50"),
    ("5.1 Structure of the Software Package", "50"),
    ("5.2 Core Module Implementation", "51"),
    ("5.2.1 Authentication & Session Security (JWT, Bcrypt)", "51"),
    ("5.2.2 AI Risk Management System (RMS) Keyword Classifier", "52"),
    ("5.2.3 Weighbridge Scale Verification & Discrepancy Tolerance Engine", "53"),
    ("5.2.4 Port Authority Clearance Adjudication Console", "54"),
    ("5.2.5 Cryptographic QR Gate Pass Generator & Verification Portal", "55"),
    ("5.2.6 Public Grievance Redressal Portal & Chairman's Inbox", "56"),
    ("5.3 User Interface Gallery & Console Screenshots (Figures 5.1 - 5.6)", "57"),
    ("5.3.1 Frontline Inspector IGM Registration Screen (Figure 5.1)", "57"),
    ("5.3.2 AI RMS Threat Tier Notification Panel (Figure 5.2)", "58"),
    ("5.3.3 Weighbridge Inspection & Weight Variance Screen (Figure 5.3)", "59"),
    ("5.3.4 Port Authority Clearance Adjudication Dashboard (Figure 5.4)", "60"),
    ("5.3.5 QR Gate Pass Public Verification Portal (Figure 5.5)", "61"),
    ("5.3.6 Grievance Submission Portal & Chairman Office Queue (Figure 5.6)", "62"),
    ("Chapter 6: User Operations Manual & Guidelines", "63"),
    ("6.1 System Administrator Operations Manual", "63"),
    ("6.2 Frontline Port Inspector Operations Manual", "64"),
    ("6.3 Senior Port Authority Adjudication Manual", "65"),
    ("6.4 Public User & Grievance Portal Manual", "66"),
    ("Chapter 7: Testing and Quality Assurance", "67"),
    ("7.1 Testing Methodology & Strategy", "67"),
    ("7.1.1 Unit Testing (API Endpoints & RMS Logic)", "67"),
    ("7.1.2 Integration Testing (Weighbridge & Authority Flow)", "68"),
    ("7.1.3 System Workflow & Security Testing", "69"),
    ("7.2 Comprehensive Test Reports & Matrix (Tables 7.1, 7.2, 7.3, 7.4)", "70"),
    ("Chapter 8: Results, Discussion & Performance Benchmarks (Table 8.1)", "74"),
    ("Chapter 9: Conclusion & Scope for Future Enhancements", "77"),
    ("9.1 Conclusion", "77"),
    ("9.2 Operational Limitations", "78"),
    ("9.3 Scope for Future Enhancements", "79"),
    ("Abbreviations and Acronyms", "81"),
    ("Appendix A: NMPA Port Operations & Compliance Guidelines", "82"),
    ("Appendix B: Complete System Source Code Listings (Backend & Frontend)", "84"),
    ("Bibliography", "120")
]

print("Master script script configured.")
