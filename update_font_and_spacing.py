import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def update_report_with_times_new_roman():
    with open('generate_full_report_docx.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace Arial with Times New Roman everywhere
    content = content.replace("run.font.name = 'Arial'", "run.font.name = 'Times New Roman'")
    content = content.replace("r_title.font.name = 'Arial'", "r_title.font.name = 'Times New Roman'")
    content = content.replace("r_sub.font.name = 'Arial'", "r_sub.font.name = 'Times New Roman'")
    content = content.replace("r_org.font.name = 'Arial'", "r_org.font.name = 'Times New Roman'")
    content = content.replace("c_run.font.name = 'Arial'", "c_run.font.name = 'Times New Roman'")
    content = content.replace("run_title.font.name = \"Arial\"", "run_title.font.name = \"Times New Roman\"")

    # Replace 1.5 Line Spacing with 1.15 Line Spacing everywhere
    content = content.replace("p.paragraph_format.line_spacing = 1.5", "p.paragraph_format.line_spacing = 1.15")

    # Update Heading Font Sizes: Level 1 -> 16pt, Level 2 -> 14pt, Level 3 -> 12pt
    content = content.replace("run.font.size = Pt(13)", "run.font.size = Pt(14)")
    content = content.replace("run.font.size = Pt(11)", "run.font.size = Pt(12)")

    # Save to both generate_full_report_docx.py and generate_report_docx.py
    with open('generate_full_report_docx.py', 'w', encoding='utf-8') as f:
        f.write(content)

    with open('generate_report_docx.py', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Updated report builder scripts with Times New Roman and 1.15 line spacing.")

if __name__ == '__main__':
    update_report_with_times_new_roman()
