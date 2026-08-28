import json
import os
from PIL import Image, ImageDraw, ImageFont

def generate_visuals():
    with open('benchmark_experiments/mapping_visuals/mistral_result.json', 'r') as f:
        data = json.load(f)

    # We passed 3 pages in order: p003 (page 0), p005 (page 1), p015 (page 2)
    page_filenames = {
        0: 'Answer_Sheet_p003.png',
        1: 'Answer_Sheet_p005.png',
        2: 'Answer_Sheet_p015.png'
    }

    image_dir = '/Users/ayushchougula/.gemini/antigravity-ide/brain/b5fb7b39-9385-4edd-81eb-0d249c3fc147/images'
    output_dir = 'benchmark_experiments/mapping_visuals'
    report_lines = ["# Mistral Mapping Visual QA Report V3\n"]
    report_lines.append("### Pages Tested\n3\n")
    report_lines.append("### Pages Sent to Mistral\nExactly:\n- Answer_Sheet_p003.png\n- Answer_Sheet_p005.png\n- Answer_Sheet_p015.png\n")
    
    report_lines.append("### Mapping Results\n")

    metrics = {
        "total": 0,
        "correct": 0,
        "incorrect": 0,
        "explicit_label": 0,
        "semantic": 0,
        "positional": 0
    }

    errors = []

    ocr_blocks = data.get('ocrBlocks', {})

    for page_idx, filename in page_filenames.items():
        original_path = os.path.join(image_dir, filename)
        if not os.path.exists(original_path):
            continue
        
        img = Image.open(original_path).convert('RGB')
        width, height = img.size
        font = ImageFont.load_default()

        # LAYER A: OCR BLOCK VIEW
        img_ocr = img.copy()
        draw_ocr = ImageDraw.Draw(img_ocr)
        for block_id, box in ocr_blocks.items():
            if f"_as_{page_idx}_" in block_id:
                x, y, w, h = box['x']*width, box['y']*height, box['w']*width, box['h']*height
                draw_ocr.rectangle([x, y, x+w, y+h], outline="blue", width=2)
        img_ocr.save(os.path.join(output_dir, filename.replace('.png', '_ocr_blocks.png')))

        # LAYER B & C: ANSWER REGIONS & MAPPING
        img_regions = img.copy()
        draw_regions = ImageDraw.Draw(img_regions)
        
        img_mapping = img.copy()
        draw_mapping = ImageDraw.Draw(img_mapping)

        report_lines.append(f"#### Page: {filename}\n")
        report_lines.append("| Answer Region | Raw Label | Normalized Label | Resolved Question | Method | Confidence |")
        report_lines.append("|---|---|---|---|---|---|")

        page_mappings = []
        for q in data.get('questions', []):
            for r in q.get('regions', []):
                if r['page'] == page_idx:
                    page_mappings.append((q, r))
        
        for o in data.get('orphanAnswers', []):
            if o['page'] == page_idx:
                page_mappings.append((o, o, True))

        for item in page_mappings:
            metrics["total"] += 1
            if len(item) == 3:
                # Orphan
                o = item[0]
                box = o['bbox']
                x, y, w, h = box['x']*width, box['y']*height, box['w']*width, box['h']*height
                draw_regions.rectangle([x, y, x+w, y+h], outline="gray", width=4)
                draw_mapping.rectangle([x, y, x+w, y+h], outline="gray", width=4)
                draw_mapping.text((x, max(0, y-20)), f"ORPHAN", fill="gray", font=font)
                report_lines.append(f"| {o['id']} | N/A | N/A | NONE | orphan | N/A |")
                continue

            q, r = item
            box = r['bbox']
            x, y, w, h = box['x']*width, box['y']*height, box['w']*width, box['h']*height

            q_id = str(q.get('id', ''))
            raw_label = str(r.get('rawLabel', ''))
            norm_label = str(r.get('normalizedLabel', ''))
            res_method = str(r.get('resolutionMethod', ''))
            res_q = str(r.get('resolvedQuestionId', ''))
            is_cont = r.get('isContinuation', False)
            note = str(r.get('note', ''))

            color = "green" if res_method in ["explicit_label", "continuation_context"] else "yellow"
            if "OVERSIZED" in note:
                color = "red"
                errors.append(f"OVERSIZED REGION DETECTED on {filename}: mapped to {q_id}")

            draw_regions.rectangle([x, y, x+w, y+h], outline="purple", width=4)
            draw_mapping.rectangle([x, y, x+w, y+h], outline=color, width=4)

            label_text = f"{raw_label} -> {norm_label} -> {res_q or q_id} ({res_method})"
            
            text_bbox = draw_mapping.textbbox((x, max(0, y-20)), label_text, font=font)
            draw_mapping.rectangle(text_bbox, fill="black")
            draw_mapping.text((x, max(0, y-20)), label_text, fill=color, font=font)

            report_lines.append(f"| region_{q_id} | {raw_label} | {norm_label} | {res_q or q_id} | {res_method} | {r.get('mappingConfidence', 'N/A')} |")

        img_regions.save(os.path.join(output_dir, filename.replace('.png', '_answer_regions.png')))
        img_mapping.save(os.path.join(output_dir, filename.replace('.png', '_mapping.png')))

        # COMPARISON
        comp_img = Image.new('RGB', (width*2, height))
        comp_img.paste(img, (0,0))
        comp_img.paste(img_mapping, (width, 0))
        comp_img.save(os.path.join(output_dir, filename.replace('.png', '_comparison.png')))

    report_lines.append("### Errors\n")
    for err in errors:
        report_lines.append(f"- {err}\n")
    if not errors:
        report_lines.append("None detected programmatically.\n")

    with open(os.path.join(output_dir, 'MISTRAL_MAPPING_VISUAL_QA_REPORT_V3.md'), 'w') as f:
        f.write("\n".join(report_lines))

if __name__ == '__main__':
    generate_visuals()
