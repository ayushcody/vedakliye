import json

notebook_path = '/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb'

with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source_str = ''.join(cell['source'])
        
        # 1. Update PIP installs for Mac
        if '1. INSTALLATION' in source_str:
            cell['source'] = [
                "# ============================================================\n",
                "# 1. INSTALLATION (Mac M4 / Apple Silicon Support)\n",
                "# ============================================================\n",
                "!pip uninstall -y Pillow\n",
                "# Install PyTorch for Mac (MPS support built-in)\n",
                "!pip install -q torch torchvision torchaudio transformers==4.46.3 tokenizers==0.20.3 safetensors\n",
                "!pip install -q pdf2image Pillow==10.4.0 pymupdf pandas==2.2.3 rapidfuzz matplotlib accelerate einops addict easydict\n",
                "print(\"Installation complete. (Restart runtime if needed)\")\n"
            ]
            continue
            
        # 2. Update Device Check (Cell 2)
        if 'torch.cuda.is_available()' in source_str and 'import os' in source_str:
            new_source = []
            for line in cell['source']:
                if 'print("CUDA available:", torch.cuda.is_available())' in line:
                    new_source.extend([
                        'print("CUDA available:", torch.cuda.is_available())\n',
                        'print("MPS (Apple Silicon) available:", torch.backends.mps.is_available())\n'
                    ])
                elif 'if torch.cuda.is_available():' in line:
                    new_source.extend([
                        'if torch.cuda.is_available():\n',
                        '    print("GPU:", torch.cuda.get_device_name(0))\n',
                        '    props = torch.cuda.get_device_properties(0)\n',
                        '    print(f"VRAM: {props.total_memory / 1024**3:.2f} GB")\n',
                        'elif torch.backends.mps.is_available():\n',
                        '    print("GPU: Apple Silicon (MPS)")\n',
                        'else:\n',
                        '    print("WARNING: GPU is not available.")\n'
                    ])
                    break
                else:
                    new_source.append(line)
            cell['source'] = new_source
            continue
            
        # 3. Update Model Loading (Cell 7)
        if 'deepseek-ai/DeepSeek-OCR-2' in source_str and 'device_map' in source_str:
            cell['source'] = [
                "# ============================================================\n",
                "# 7. LOAD MODEL (MPS / CUDA / CPU)\n",
                "# ============================================================\n",
                "from transformers import AutoTokenizer, AutoModel\n",
                "\n",
                "MODEL_ID = \"deepseek-ai/DeepSeek-OCR-2\"\n",
                "\n",
                "if torch.cuda.is_available():\n",
                "    device = \"cuda\"\n",
                "elif torch.backends.mps.is_available():\n",
                "    device = \"mps\"\n",
                "else:\n",
                "    device = \"cpu\"\n",
                "    print(\"WARNING: Running on CPU, this will be very slow.\")\n",
                "\n",
                "tokenizer = AutoTokenizer.from_pretrained(\n",
                "    MODEL_ID,\n",
                "    trust_remote_code=True,\n",
                "    use_fast=False,\n",
                ")\n",
                "\n",
                "MODEL_DTYPE = torch.bfloat16\n",
                "ATTENTION_BACKEND = \"eager\" # Flash Attention 2 doesn't work on Mac MPS\n",
                "\n",
                "print(f\"Loading DeepSeek-OCR-2 on {device} with eager attention...\")\n",
                "model = AutoModel.from_pretrained(\n",
                "    MODEL_ID,\n",
                "    trust_remote_code=True,\n",
                "    use_safetensors=True,\n",
                "    _attn_implementation=ATTENTION_BACKEND,\n",
                "    torch_dtype=MODEL_DTYPE\n",
                ").to(device).eval()\n",
                "\n",
                "print(\"Model loaded.\")\n",
                "print(\"Attention backend:\", ATTENTION_BACKEND)\n",
                "print(\"Model dtype:\", next(model.parameters()).dtype)\n"
            ]
            continue
            
        # 4. Make sure inference context uses the correct device (if there were any hardcoded `.cuda()`)
        if '.cuda()' in source_str:
            new_source = []
            for line in cell['source']:
                new_source.append(line.replace('.cuda()', '.to(device)'))
            cell['source'] = new_source

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook Mac M4 fix applied.")
