import json

notebook_path = '/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb'

with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source_str = ''.join(cell['source'])
        if '!pip install -q torch' in source_str or '1. INSTALLATION' in source_str:
            cell['source'] = [
                "# ============================================================\n",
                "# 1. INSTALLATION\n",
                "# ============================================================\n",
                "# Uninstall existing Pillow to prevent corrupted mixed-version installs in Colab\n",
                "!pip uninstall -y Pillow\n",
                "!pip install -q torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 \\\n",
                "    transformers==4.46.3 tokenizers==0.20.3 safetensors flash-attn==2.7.3\n",
                "!pip install -q pdf2image Pillow==10.4.0 pymupdf pandas==2.2.3 rapidfuzz matplotlib accelerate einops addict easydict\n",
                "print(\"Installation complete. PLEASE RESTART RUNTIME NOW (Runtime -> Restart session) before running the next cells.\")"
            ]
            break

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook Pillow fix applied.")
