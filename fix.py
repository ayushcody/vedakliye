import re

def fix_divs(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    open_divs = len(re.findall(r'<div\b[^>]*>', content))
    close_divs = len(re.findall(r'</div>', content))

    print(f"{filepath}: open {open_divs}, close {close_divs}")

fix_divs('src/components/UploadScreen.tsx')
fix_divs('src/components/MappingScreen.tsx')
fix_divs('src/components/ProcessingScreen.tsx')
