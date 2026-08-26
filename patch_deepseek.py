import os
import re

file_path = "/Users/ayushchougula/.cache/huggingface/modules/transformers_modules/deepseek-ai/DeepSeek-OCR-2/aaa02f3811945a91062062994c5c4a3f4c0af2b0/modeling_deepseekocr2.py"

if not os.path.exists(file_path):
    print("File not found")
    exit(1)

with open(file_path, "r") as f:
    content = f.read()

# Replace hardcoded .cuda() with .to(self.device)
content = content.replace(".cuda()", ".to(self.device)")
content = content.replace('torch.autocast("cuda"', 'torch.autocast("mps"')

with open(file_path, "w") as f:
    f.write(content)

print("DeepSeek-OCR-2 patched for Mac MPS!")
