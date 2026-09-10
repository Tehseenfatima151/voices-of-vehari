import re

with open('Voices_of_Vehari_Standalone.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

body_start = content.find('</style>') + 8
first_view = content.find('<section class="view"')

header_nav = content[body_start:first_view]
# save clean header
clean_nav = re.sub(r'src=["\']data:[^"\']+["\']', 'src="[LOGO_DATA_URI]"', header_nav)

with open('extracted/nav_and_topbar.html', 'w', encoding='utf-8') as f:
    f.write(clean_nav)

print("Nav & Topbar:")
print(clean_nav)

# Also extract the embedded images into extracted/images folder
import os
import base64

os.makedirs('extracted/images', exist_ok=True)
images = re.findall(r'src=["\']data:image/([^;]+);base64,([^"\']+)["\']', content)
print(f"\nExtracted {len(images)} base64 images:")
for idx, (img_type, b64_data) in enumerate(images):
    filename = f"extracted/images/image_{idx}.{img_type}"
    try:
        data = base64.b64decode(b64_data)
        with open(filename, 'wb') as img_f:
            img_f.write(data)
        print(f"  Image {idx}: {filename} ({len(data)} bytes, type: {img_type})")
    except Exception as e:
        print(f"  Image {idx} decode error: {e}")
