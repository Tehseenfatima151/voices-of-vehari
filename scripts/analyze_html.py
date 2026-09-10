import re
import json
import os

with open('Voices_of_Vehari_Standalone.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

os.makedirs('extracted', exist_ok=True)

# Extract and save CSS
style_match = re.search(r'<style[^>]*>(.*?)</style>', content, re.DOTALL)
if style_match:
    with open('extracted/site_style.css', 'w', encoding='utf-8') as sf:
        sf.write(style_match.group(1))
    print(f"Extracted CSS ({len(style_match.group(1))} bytes)")

# Replace large data URIs with placeholders for structural inspection
def replace_data_uri(match):
    src = match.group(1)
    if src.startswith('data:image'):
        mime = src.split(';')[0].replace('data:', '')
        return f'src="[EMBEDDED_{mime.upper()}]"'
    return match.group(0)

clean_html = re.sub(r'src=["\'](data:[^"\']+)["\']', replace_data_uri, content)

# Header & Nav
header_match = re.search(r'(<header.*?</header>)', clean_html, re.DOTALL)
if header_match:
    with open('extracted/header.html', 'w', encoding='utf-8') as f:
        f.write(header_match.group(1))
    print("Extracted Header")

# Footer
footer_match = re.search(r'(<footer.*?</footer>)', clean_html, re.DOTALL)
if footer_match:
    with open('extracted/footer.html', 'w', encoding='utf-8') as f:
        f.write(footer_match.group(1))
    print("Extracted Footer")

# Find views
views = re.findall(r'<section class="view" id="([^"]+)">(.*?)(?=(?:<section class="view" id=)|(?:<footer)|(?:</body>)|$)', clean_html, re.DOTALL)
print(f"Found {len(views)} views:")
views_summary = {}

for vid, vhtml in views:
    h1 = [re.sub(r'<[^>]+>', '', x).strip() for x in re.findall(r'<h1[^>]*>(.*?)</h1>', vhtml, re.DOTALL)]
    h2 = [re.sub(r'<[^>]+>', '', x).strip() for x in re.findall(r'<h2[^>]*>(.*?)</h2>', vhtml, re.DOTALL)]
    h3 = [re.sub(r'<[^>]+>', '', x).strip() for x in re.findall(r'<h3[^>]*>(.*?)</h3>', vhtml, re.DOTALL)]
    sections = re.findall(r'<section[^>]*class="([^"]+)"', vhtml)
    
    views_summary[vid] = {
        'length': len(vhtml),
        'h1': h1,
        'h2': h2,
        'h3': h3,
        'section_classes': sections
    }
    with open(f'extracted/view_{vid}.html', 'w', encoding='utf-8') as f:
        f.write(vhtml)
    print(f"  - {vid}: h1={h1}, h2_count={len(h2)}, h3_count={len(h3)}")

with open('extracted/summary.json', 'w', encoding='utf-8') as f:
    json.dump(views_summary, f, indent=2)

print("\nAnalysis complete. Results in extracted/ directory.")
