import glob
import re

files = glob.glob('extracted/view_*.html')
for f in sorted(files):
    with open(f, 'r', encoding='utf-8') as vf:
        txt = vf.read()
    has_topbar = 'topbar' in txt
    has_nav = 'class="nav"' in txt or "class='nav'" in txt
    has_footer = 'footer' in txt
    # Find all h1, h2, sections
    h1 = re.findall(r'<h1[^>]*>(.*?)</h1>', txt, re.DOTALL)
    h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', txt, re.DOTALL)
    print(f'{f}: len={len(txt)}, topbar={has_topbar}, nav={has_nav}, footer={has_footer}')
    if h1:
        print('   h1:', [re.sub(r'<[^>]+>', '', x).strip() for x in h1])
    if h2:
        print('   h2:', [re.sub(r'<[^>]+>', '', x).strip() for x in h2])
