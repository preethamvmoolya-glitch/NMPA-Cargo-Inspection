import requests
import base64
import os

url = "https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

try:
    response = requests.get(url, headers=headers, timeout=15)
    if response.status_code == 200:
        encoded = base64.b64encode(response.content).decode('utf-8')
        base64_uri = f"data:image/svg+xml;base64,{encoded}"
        
        # Files to update
        files_to_update = [
            "../frontend/src/pages/PortAuthority.jsx",
            "../frontend/src/pages/VerifyClearance.jsx"
        ]
        
        target_img_pattern = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png'
        
        for file_path in files_to_update:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Replace the Wikimedia URL with our Base64 SVG URI and clear the alt text to avoid any fallback text
                new_content = content.replace(target_img_pattern, base64_uri)
                new_content = new_content.replace('alt="Emblem of India"', 'alt=""')
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Successfully updated: {file_path}")
            else:
                print(f"File not found: {file_path}")
    else:
        print(f"Failed to fetch SVG: status code {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
