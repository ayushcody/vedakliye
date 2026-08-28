import json
import os
from PIL import Image, ImageDraw, ImageFont

def generate_full_visuals():
    with open('benchmark_experiments/MISTRAL_FULL_RUN_RESULT.json', 'r') as f:
        data = json.load(f)

    as_dir = 'extracted_full_pages/as'
    output_dir = 'benchmark_experiments/full_run_visuals'
    artifact_dir = '/Users/ayushchougula/.gemini/antigravity-ide/brain/b5fb7b39-9385-4edd-81eb-0d249c3fc147'
    os.makedirs(output_dir, exist_ok=True)

    font = ImageFont.load_default()

    # Collect regions by page (0-indexed)
    page_regions = {}
    for q in data.get('questions', []):
        for r in q.get('regions', []):
            p = r.get('page', 0)
            if p not in page_regions:
                page_regions[p] = []
            page_regions[p].append((q, r))

    for o in data.get('orphanAnswers', []):
        p = o.get('page', 0)
        if p not in page_regions:
            page_regions[p] = []
        page_regions[p].append((o, o, True))

    generated_pages = []

    for p_idx in range(24):
        p_num = p_idx + 1
        img_path = os.path.join(as_dir, f'as_p{p_num:03d}.png')
        if not os.path.exists(img_path):
            continue

        img = Image.open(img_path).convert('RGB')
        width, height = img.size

        img_mapping = img.copy()
        draw = ImageDraw.Draw(img_mapping)

        items = page_regions.get(p_idx, [])
        if not items:
            # Draw an "Unanswered" banner if page had no answers mapped
            draw.rectangle([50, 50, width - 50, 100], fill="lightgray")
            draw.text((60, 65), f"Page {p_num}: No Answers Mapped / Blank", fill="black", font=font)
        else:
            for item in items:
                if len(item) == 3:
                    o = item[0]
                    box = o.get('bbox', {})
                    x, y, w, h = box.get('x', 0)*width, box.get('y', 0)*height, box.get('w', 0)*width, box.get('h', 0)*height
                    draw.rectangle([x, y, x+w, y+h], outline="gray", width=4)
                    draw.text((x, max(0, y-20)), f"ORPHAN ANSWER", fill="gray", font=font)
                    continue

                q, r = item
                box = r.get('bbox', {})
                x, y, w, h = box.get('x', 0)*width, box.get('y', 0)*height, box.get('w', 0)*width, box.get('h', 0)*height

                q_id = str(q.get('id', ''))
                score = q.get('score', 0)
                max_marks = q.get('maxMarks', 0)
                raw_label = str(r.get('rawLabel') or q.get('extractedLabel') or '')
                res_method = str(r.get('resolutionMethod') or 'explicit_label')
                res_q = str(r.get('resolvedQuestionId') or q_id)

                color = "#008800" if res_method in ["explicit_label", "continuation_context"] else "#cc8800"

                draw.rectangle([x, y, x+w, y+h], outline=color, width=4)

                tag_text = f"Q{res_q} [{score}/{max_marks} marks] ({res_method}) | Label: {raw_label}"
                text_bbox = draw.textbbox((x, max(0, y-22)), tag_text, font=font)
                draw.rectangle([text_bbox[0]-2, text_bbox[1]-2, text_bbox[2]+2, text_bbox[3]+2], fill="black")
                draw.text((x, max(0, y-22)), tag_text, fill="white", font=font)

        # Create side-by-side comparison
        comp_img = Image.new('RGB', (width * 2, height))
        comp_img.paste(img, (0, 0))
        comp_img.paste(img_mapping, (width, 0))

        out_comp_path = os.path.join(output_dir, f'Answer_Sheet_p{p_num:03d}_batch_comparison.png')
        comp_img.save(out_comp_path)

        # Also copy to artifact dir for viewing
        art_comp_path = os.path.join(artifact_dir, f'Answer_Sheet_p{p_num:03d}_batch_comparison.png')
        comp_img.save(art_comp_path)
        generated_pages.append((p_num, out_comp_path, len(items)))

    print(f"Successfully generated comparison images for {len(generated_pages)} pages.")

generate_full_visuals()
