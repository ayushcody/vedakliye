import json

notebook_path = '/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb'

with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = cell['source']
        
        # Update pip install cell
        for i, line in enumerate(source):
            if line.startswith('!pip '):
                # We will just replace the whole source for this cell
                if 'transformers' in ''.join(source):
                    cell['source'] = [
                        "# ============================================================\n",
                        "# 1. INSTALLATION\n",
                        "# ============================================================\n",
                        "!pip install -q torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 \\\n",
                        "    transformers==4.46.3 tokenizers==0.20.3 safetensors flash-attn==2.7.3\n",
                        "!pip install -q pdf2image Pillow==10.4.0 PyMuPDF pandas==2.2.3 rapidfuzz matplotlib accelerate einops addict easydict\n",
                        "print(\"Installation complete.\")"
                    ]
                break
                
        # Fix imports cell
        new_source = []
        for line in cell['source']:
            if 'import fitz' in line:
                new_source.append('import pymupdf as fitz  # PyMuPDF\n')
            else:
                new_source.append(line)
        cell['source'] = new_source

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook updated.")
