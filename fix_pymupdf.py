import json

notebook_path = '/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb'

with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        new_source = []
        for line in cell['source']:
            line = line.replace('import pymupdf as fitz', 'import pymupdf')
            line = line.replace('import fitz', 'import pymupdf')
            line = line.replace('fitz.', 'pymupdf.')
            new_source.append(line)
        cell['source'] = new_source

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("PyMuPDF fixed.")
