import json

notebook_path = '/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb'
with open(notebook_path, 'r') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source_str = ''.join(cell['source'])
        if 'dummy_question.pdf' in source_str:
            new_source = []
            for line in cell['source']:
                line = line.replace('dummy_question.pdf', 'Question_Paper.pdf')
                line = line.replace('dummy_answer.pdf', 'Answer_Sheet.pdf')
                new_source.append(line)
            cell['source'] = new_source

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook updated to use actual PDFs.")
