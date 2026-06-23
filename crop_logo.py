import os
from PIL import Image, ImageChops

def crop_logo():
    src_path = r"C:\Users\Inchara salian\.gemini\antigravity\brain\f3b28df5-1b3a-4c31-819b-4dd5e1097abb\media__1779187340421.png"
    dest_path = r"c:\NMPA final project\frontend\public\nmpa-logo.png"
    
    if not os.path.exists(src_path):
        print(f"Source file not found: {src_path}")
        return
        
    img = Image.open(src_path)
    # The image is circular with a white/cream background outside the circle.
    # Let's crop it to the bounding box of the non-white/non-cream area, or simply crop it.
    # The image appears to have some margins. Let's find the border of the red circle.
    # We can inspect pixels to find where the circular logo starts.
    # Or we can do a smart crop: the logo circle is centered.
    # Let's find the circle boundaries by checking where the color departs from the background cream/white.
    width, height = img.size
    
    # Standard crop to remove whitespace:
    # Let's sample the background color from the corner (0, 0)
    bg_color = img.getpixel((5, 5))
    
    # We'll scan from edges to find the boundary of the circle
    left, top, right, bottom = 0, 0, width, height
    
    # Scan from top
    for y in range(height):
        row_colors = [img.getpixel((x, y)) for x in range(0, width, 10)]
        if any(sum(abs(c - b) for c, b in zip(color[:3], bg_color[:3])) > 30 for color in row_colors):
            top = y
            break
            
    # Scan from bottom
    for y in range(height - 1, -1, -1):
        row_colors = [img.getpixel((x, y)) for x in range(0, width, 10)]
        if any(sum(abs(c - b) for c, b in zip(color[:3], bg_color[:3])) > 30 for color in row_colors):
            bottom = y
            break
            
    # Scan from left
    for x in range(width):
        col_colors = [img.getpixel((x, y)) for y in range(0, height, 10)]
        if any(sum(abs(c - b) for c, b in zip(color[:3], bg_color[:3])) > 30 for color in col_colors):
            left = x
            break
            
    # Scan from right
    for x in range(width - 1, -1, -1):
        col_colors = [img.getpixel((x, y)) for y in range(0, height, 10)]
        if any(sum(abs(c - b) for c, b in zip(color[:3], bg_color[:3])) > 30 for color in col_colors):
            right = x
            break
            
    print(f"Detected bounding box: left={left}, top={top}, right={right}, bottom={bottom}")
    
    # Let's crop to a square representing the circle
    box_w = right - left
    box_h = bottom - top
    box_size = max(box_w, box_h)
    
    # Add a tiny padding of 2 pixels
    pad = 2
    cx = left + box_w // 2
    cy = top + box_h // 2
    
    crop_left = max(0, cx - box_size // 2 - pad)
    crop_top = max(0, cy - box_size // 2 - pad)
    crop_right = min(width, cx + box_size // 2 + pad)
    crop_bottom = min(height, cy + box_size // 2 + pad)
    
    cropped = img.crop((crop_left, crop_top, crop_right, crop_bottom))
    
    # Make background outside the circle transparent if possible!
    # A standard NMPA logo is circular. We can apply a circular mask.
    cropped = cropped.convert("RGBA")
    w, h = cropped.size
    mask = Image.new("L", (w, h), 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, w, h), fill=255)
    
    result = Image.new("RGBA", (w, h))
    result.paste(cropped, (0, 0), mask=mask)
    
    # Save the output
    result.save(dest_path, "PNG")
    print(f"Saved cropped transparent logo to {dest_path}")

if __name__ == "__main__":
    crop_logo()
