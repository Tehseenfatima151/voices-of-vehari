import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('Voices_of_Vehari_Standalone.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace data:image...
clean_content = re.sub(r'src=["\']data:image/[^;]+;base64,[^"\']+["\']', 'src="[IMAGE]"', content)

with open('extracted/clean_site.html', 'w', encoding='utf-8') as f:
    f.write(clean_content)

print("Saved extracted/clean_site.html, length:", len(clean_content))

# Look for topbar, nav, footer, etc.
tags = re.findall(r'<(div|header|nav|section|footer)\s+class="([^"]+)"(?:\s+id="([^"]+)")?', clean_content)
for tag, cls, tid in tags[:50]:
    print(f"<{tag} class='{cls}' id='{tid}'>")
