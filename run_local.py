import json
import os
from PIL import Image

# 1. Create dummy PDFs
question_img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
answer_img = Image.new('RGB', (800, 1000), color=(255, 255, 255))
question_img.save('dummy_question.pdf')
answer_img.save('dummy_answer.pdf')

# 2. Modify notebook to remove Colab upload
notebook_path = '/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb'
with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source_str = ''.join(cell['source'])
        if 'google.colab' in source_str or 'files.upload()' in source_str:
            cell['source'] = [
                "# ============================================================\n",
                "# 4. USE LOCAL FILES (Replaced Colab Upload)\n",
                "# ============================================================\n",
                "import shutil\n",
                "from pathlib import Path\n",
                "\n",
                "QUESTION_FILE = Path('/Users/ayushchougula/Desktop/Ayush/Projects/veda/dummy_question.pdf')\n",
                "ANSWER_FILE = Path('/Users/ayushchougula/Desktop/Ayush/Projects/veda/dummy_answer.pdf')\n",
                "\n",
                "shutil.copy2(QUESTION_FILE, DIRS[\"raw\"] / QUESTION_FILE.name)\n",
                "shutil.copy2(ANSWER_FILE, DIRS[\"raw\"] / ANSWER_FILE.name)\n",
                "\n",
                "print(\"\\nQuestion paper:\", QUESTION_FILE)\n",
                "print(\"Answer sheet :\", ANSWER_FILE)\n"
            ]

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook prepared for local execution.")
