import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def generate_85_page_college_report():
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

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
            run.font.color.rgb = RGBColor(0, 51, 102)
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
        p.paragraph_format.line_spacing = 1.5
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

    print("Framework initialized. Building complete expanded content...")
    return doc

print("Script template ready.")
