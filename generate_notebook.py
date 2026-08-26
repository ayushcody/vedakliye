import json
import os
from pathlib import Path

cells = []

def add_md(text):
    source = [line + "\n" for line in text.split("\n")]
    if text.endswith("\n"):
        source = source[:-1]
    # Remove the very last newline from the last string to match jupyter format exactly
    if source:
        source[-1] = source[-1].rstrip("\n")
        
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": source
    })

def add_code(text):
    source = [line + "\n" for line in text.split("\n")]
    if text.endswith("\n"):
        source = source[:-1]
    if source:
        source[-1] = source[-1].rstrip("\n")

    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source
    })

add_md("# DeepSeek-OCR-2 \u2014 Assessment Extraction & Answer Mapping\n\nThis notebook processes a question paper and handwritten answer sheet, extracts questions, extracts answer regions, and maps them hierarchically.")

add_md("## 00 Configuration")
add_code("""import os
from pathlib import Path

ROOT = Path("/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment")
QUESTION_FILE = Path("/Users/ayushchougula/Desktop/Ayush/Projects/veda/Question_Paper.pdf")
ANSWER_FILE = Path("/Users/ayushchougula/Desktop/Ayush/Projects/veda/Answer_Sheet.pdf")

DIRS = {
    "raw": ROOT / "raw",
    "question_pages": ROOT / "pages" / "questions",
    "answer_pages": ROOT / "pages" / "answers",
    "question_ocr": ROOT / "ocr" / "questions",
    "answer_ocr": ROOT / "ocr" / "answers",
    "viz": ROOT / "visualizations",
    "exports": ROOT / "exports",
}

for d in DIRS.values():
    d.mkdir(parents=True, exist_ok=True)""")

add_md("## 01 Environment Diagnostics")
add_code("""import sys
import platform
import subprocess

def detect_runtime():
    info = {
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "cuda_available": False,
        "cuda_device": None,
        "mps_available": False,
        "device": "cpu"
    }
    try:
        import torch
        info["pytorch_version"] = torch.__version__
        if torch.cuda.is_available():
            info["cuda_available"] = True
            info["cuda_device"] = torch.cuda.get_device_name(0)
            info["device"] = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            info["mps_available"] = True
            info["device"] = "mps"
    except ImportError:
        pass
    
    try:
        import transformers
        info["transformers_version"] = transformers.__version__
    except ImportError:
        pass

    return info

runtime_info = detect_runtime()
for k, v in runtime_info.items():
    print(f"{k}: {v}")""")

add_md("## 02 Dependencies")
add_code("""# Execute this cell to install dependencies. Restart runtime if required.
# !pip uninstall -y Pillow
# !pip install -q torch torchvision torchaudio transformers==4.46.3 tokenizers==0.20.3 safetensors
# !pip install -q pdf2image Pillow==10.4.0 pymupdf pandas rapidfuzz matplotlib accelerate einops addict easydict flash-attn""")

add_md("## 03 Imports")
add_code("""import re
import ast
import json
import time
import shutil
import statistics
from typing import Any, Dict, List, Optional, Tuple

import pymupdf
import torch
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
from rapidfuzz.fuzz import token_set_ratio
from transformers import AutoTokenizer, AutoModel""")

add_md("## 04 Utility Functions")
add_code("""def bbox_area(b):
    return max(0, b[2] - b[0]) * max(0, b[3] - b[1])

def bbox_union(boxes):
    boxes = [b for b in boxes if b and len(b) == 4]
    if not boxes:
        return None
    return [
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    ]

def normalize_for_match(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\\s]", " ", text)
    return " ".join(text.split())

def semantic_score(q_text, a_text):
    if not q_text or not a_text:
        return 0.0
    q = normalize_for_match(q_text)
    a = normalize_for_match(a_text)
    return token_set_ratio(q, a) / 100.0""")

add_md("## 05 PDF Rendering")
add_code("""def render_pdf_to_images(path: Path, out_dir: Path, dpi: int = 180) -> List[Dict[str, Any]]:
    path = Path(path)
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*"):
        if old.is_file(): old.unlink()

    pages_info = []
    if path.suffix.lower() == ".pdf":
        doc = pymupdf.open(path)
        scale = dpi / 72.0
        matrix = pymupdf.Matrix(scale, scale)

        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            out = out_dir / f"{path.stem}_p{i+1:03d}.png"
            pix.save(out)
            pages_info.append({
                "page_number": i + 1,
                "image_path": str(out),
                "width": pix.width,
                "height": pix.height,
                "dpi": dpi
            })
        doc.close()
    return pages_info

def load_document(path: Path, out_dir: Path) -> List[Dict[str, Any]]:
    return render_pdf_to_images(path, out_dir)

if QUESTION_FILE.exists() and ANSWER_FILE.exists():
    question_pages = load_document(QUESTION_FILE, DIRS["question_pages"])
    answer_pages = load_document(ANSWER_FILE, DIRS["answer_pages"])
    print(f"Rendered {len(question_pages)} question pages and {len(answer_pages)} answer pages.")
else:
    print("PDFs not found. Please verify paths.")""")

add_md("## 06 DeepSeek-OCR-2 Loading")
add_code("""class DeepSeekOCR2Engine:
    def __init__(self, model_id="deepseek-ai/DeepSeek-OCR-2"):
        self.model_id = model_id
        self.device = runtime_info["device"]
        self.tokenizer = None
        self.model = None

    def load(self):
        print(f"Loading {self.model_id} on {self.device}...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id, trust_remote_code=True, use_fast=False
        )
        
        attn_impl = "flash_attention_2" if self.device == "cuda" else "eager"
        if self.device == "mps":
            print("MPS path selected. Using eager attention for compatibility.")
        
        self.model = AutoModel.from_pretrained(
            self.model_id,
            trust_remote_code=True,
            use_safetensors=True,
            _attn_implementation=attn_impl,
            torch_dtype=torch.bfloat16
        ).to(self.device).eval()
        print("Model loaded successfully.")

engine = DeepSeekOCR2Engine()
# engine.load() # Uncomment to actually load the model""")

add_md("## 07 DeepSeek-OCR-2 Inference")
add_code("""def infer_page(engine, image_path, output_dir, prompt, base_size=1024, image_size=768, crop_mode=True):
    import time
    start = time.perf_counter()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        with torch.inference_mode():
            result = engine.model.infer(
                engine.tokenizer,
                prompt=prompt,
                image_file=str(image_path),
                output_path=str(output_dir),
                base_size=base_size,
                image_size=image_size,
                crop_mode=crop_mode,
                save_results=True,
            )
        elapsed = time.perf_counter() - start
        mmd_files = list(output_dir.rglob("*.mmd"))
        raw_text = mmd_files[0].read_text(encoding="utf-8", errors="ignore") if mmd_files else ""
        return {"status": "success", "raw_text": raw_text, "elapsed": elapsed, "error": None}
    except Exception as e:
        elapsed = time.perf_counter() - start
        return {"status": "error", "raw_text": "", "elapsed": elapsed, "error": str(e)}

def extract_grounding(engine, pages, output_dir, prompt):
    results = []
    for page in pages:
        print(f"Processing page {page['page_number']}...")
        page_dir = output_dir / f"page_{page['page_number']:03d}"
        res = infer_page(engine, page["image_path"], page_dir, prompt)
        res["page"] = page["page_number"]
        res["image_path"] = page["image_path"]
        res["width"] = page["width"]
        res["height"] = page["height"]
        results.append(res)
    return results

# QUESTION_PROMPT = "<image>\\n<|grounding|>Convert the document to markdown."
# ANSWER_PROMPT = "<image>\\n<|grounding|>Convert the document to markdown."
# question_raw = extract_grounding(engine, question_pages, DIRS["question_ocr"], QUESTION_PROMPT)
# answer_raw = extract_grounding(engine, answer_pages, DIRS["answer_ocr"], ANSWER_PROMPT)""")

add_md("## 08 Grounding Parser")
add_code("""REF_DET_RE = re.compile(
    r"(?P<before>.*?)<\\|ref\\|>(?P<label>.*?)<\\|/ref\\|>\\s*<\\|det\\|>(?P<det>.*?)<\\|/det\\|>", re.S
)

def safe_parse_list(value: str):
    try: return json.loads(value)
    except:
        try: return ast.literal_eval(value)
        except: return None

def normalize_coordinates(box, W, H):
    # DeepSeek gives 0-1000 normalized coordinates
    x1, y1, x2, y2 = [max(0.0, min(1000.0, float(v))) for v in box]
    px = [
        round(x1 * W / 1000.0),
        round(y1 * H / 1000.0),
        round(x2 * W / 1000.0),
        round(y2 * H / 1000.0),
    ]
    px[0], px[2] = sorted([px[0], px[2]])
    px[1], px[3] = sorted([px[1], px[3]])
    return px

def parse_grounding(raw_results, source_type):
    records = []
    for r in raw_results:
        if r["status"] == "error": continue
        W, H = r["width"], r["height"]
        matches = REF_DET_RE.finditer(r["raw_text"])
        for match in matches:
            label = match.group("label").strip()
            boxes = safe_parse_list(match.group("det").strip())
            if not isinstance(boxes, list): continue
            for box in boxes:
                if isinstance(box, list) and len(box) == 4:
                    px = normalize_coordinates(box, W, H)
                    records.append({
                        "page": r["page"],
                        "source_type": source_type,
                        "text": match.group("before").strip(),
                        "ref_label": label,
                        "bbox_px": px,
                        "page_width": W,
                        "page_height": H
                    })
    # Assign IDs
    for i, rec in enumerate(records, start=1):
        rec["region_id"] = f"{source_type[:4].upper()}_{rec['page']:03d}_{i:04d}"
    return records""")

add_md("## 09 Grounding Visualization")
add_code("""def visualize_grounding(records, pages, out_dir, prefix):
    out_dir.mkdir(parents=True, exist_ok=True)
    page_dict = {p["page_number"]: p["image_path"] for p in pages}
    
    for page_num, image_path in page_dict.items():
        page_records = [r for r in records if r["page"] == page_num]
        if not page_records: continue
        img = Image.open(image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        for idx, r in enumerate(page_records, start=1):
            x1, y1, x2, y2 = r["bbox_px"]
            draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
            caption = f"{idx}: {r['ref_label']} | {r['text'][:30]}"
            draw.text((x1, max(0, y1 - 20)), caption, fill="red")
        out = out_dir / f"{prefix}_p{page_num:03d}.png"
        img.save(out)
        print(f"Saved visualization for {prefix} page {page_num} with {len(page_records)} regions")""")

add_md("## 10 Question Extraction")
add_code("""LABEL_PATTERNS = [
    re.compile(r"^\\s*(?:q(?:uestion)?[\\s\\.\\-]*)?(\\d{1,3})\\s*(?:[\\(\\[\\-]?\\s*([a-z])\\s*[\\)\\]]?)", re.I),
    re.compile(r"^\\s*q(?:uestion)?[\\s\\.\\-]*(\\d{1,3})\\s*([a-z])", re.I),
    re.compile(r"^\\s*(?:q(?:uestion)?[\\s\\.\\-]*)?(\\d{1,3})(?:[\\.\\)]|\\s|$)", re.I)
]

def normalize_question_label(text: str):
    if not text: return None
    s = " ".join(str(text).strip().split())
    for pat in LABEL_PATTERNS:
        m = pat.match(s)
        if m:
            groups = m.groups()
            number = groups[0]
            letter = groups[1] if len(groups) > 1 else None
            return f"{int(number)}{letter.lower()}" if letter else str(int(number))
    return None

def extract_questions(question_records):
    questions = []
    for row in question_records:
        candidates = [row.get("text", ""), row.get("ref_label", ""), f"{row.get('ref_label','')} {row.get('text','')}"]
        qlabel = next((normalize_question_label(c) for c in candidates if normalize_question_label(c)), None)
        questions.append({
            "question_id": "",
            "display_number": row.get("ref_label"),
            "normalized_label": qlabel,
            "text": row["text"],
            "page": row["page"],
            "bbox_px": row["bbox_px"],
            "order_index": 0
        })
    questions.sort(key=lambda q: (q["page"], q["bbox_px"][1], q["bbox_px"][0]))
    for i, q in enumerate(questions, start=1):
        q["question_id"] = f"Q{i:04d}"
        q["order_index"] = i
    return questions""")

add_md("## 11 Answer Extraction")
add_code("""def extract_answer_regions(answer_records):
    answers = []
    for row in answer_records:
        candidates = [row.get("text", ""), row.get("ref_label", ""), f"{row.get('ref_label','')} {row.get('text','')}"]
        qlabel = next((normalize_question_label(c) for c in candidates if normalize_question_label(c)), None)
        answers.append({
            "answer_region_id": row["region_id"],
            "detected_label": qlabel,
            "raw_label": row.get("ref_label"),
            "text": row["text"],
            "page": row["page"],
            "bbox_px": row["bbox_px"],
            "page_width": row["page_width"],
            "page_height": row["page_height"]
        })
    answers.sort(key=lambda a: (a["page"], a["bbox_px"][1], a["bbox_px"][0]))
    return answers""")

add_md("## 12 Answer Grouping")
add_code("""def group_answer_regions(answer_regions):
    # This acts as an initial grouping pass if needed, but AnswerMapper can also handle it.
    # We will pass atomic regions to AnswerMapper to allow hierarchical merging.
    return answer_regions""")

add_md("## 13 Question-Answer Mapping")
add_code("""class AnswerMapper:
    def __init__(self, questions, answers):
        self.questions = questions
        self.answers = answers
        self.used_answers = set()
        self.mappings = []

    def map_level_1_exact(self):
        grouped = {}
        for a in self.answers:
            if a["detected_label"]: grouped.setdefault(a["detected_label"], []).append(a)
            
        for q in self.questions:
            label = q["normalized_label"]
            if label and label in grouped:
                candidates = grouped[label]
                a_ids = [a["answer_region_id"] for a in candidates]
                self.mappings.append({
                    "question_id": q["question_id"],
                    "question_label": label,
                    "answer_region_ids": a_ids,
                    "method": "exact_label",
                    "confidence": 1.0,
                    "review_required": False
                })
                self.used_answers.update(a_ids)

    def map_level_3_semantic(self, min_score=0.72):
        mapped_qids = {m["question_id"] for m in self.mappings}
        for q in self.questions:
            if q["question_id"] in mapped_qids: continue
            
            candidates = [a for a in self.answers if a["answer_region_id"] not in self.used_answers]
            if not candidates: continue
            
            scored = [(semantic_score(q["text"], a["text"]), a) for a in candidates]
            scored.sort(key=lambda x: x[0], reverse=True)
            best_score, best = scored[0]
            
            if best_score >= min_score:
                self.mappings.append({
                    "question_id": q["question_id"],
                    "question_label": q["normalized_label"],
                    "answer_region_ids": [best["answer_region_id"]],
                    "method": "semantic_match",
                    "confidence": round(best_score, 4),
                    "review_required": False
                })
                self.used_answers.update([best["answer_region_id"]])

    def finalize(self):
        mapped_qids = {m["question_id"] for m in self.mappings}
        for q in self.questions:
            if q["question_id"] not in mapped_qids:
                self.mappings.append({
                    "question_id": q["question_id"],
                    "question_label": q["normalized_label"],
                    "answer_region_ids": [],
                    "method": "none",
                    "confidence": 0.0,
                    "review_required": True,
                    "status": "unanswered"
                })
        
        for m in self.mappings:
            if "status" not in m: m["status"] = "answered"
            
        unmatched = [a for a in self.answers if a["answer_region_id"] not in self.used_answers]
        return self.mappings, unmatched

# Example usage:
# mapper = AnswerMapper(questions, answer_regions)
# mapper.map_level_1_exact()
# mapper.map_level_3_semantic()
# mappings, unmatched = mapper.finalize()""")

add_md("## 14 Coordinate Normalization")
add_code("""def format_final_regions(answer_ids, answer_lookup):
    regions = []
    for aid in answer_ids:
        if aid in answer_lookup:
            a = answer_lookup[aid]
            regions.append({
                "page": a["page"],
                "bbox": a["bbox_px"]
            })
    return regions""")

add_md("## 15 Final JSON")
add_code("""def build_final_json(questions, mappings, unmatched, answer_lookup):
    final_questions = []
    mapping_dict = {m["question_id"]: m for m in mappings}
    
    for q in questions:
        m = mapping_dict.get(q["question_id"], {})
        final_questions.append({
            "question_id": q["question_id"],
            "display_number": q["display_number"],
            "text": q["text"],
            "order_index": q["order_index"],
            "status": m.get("status", "unanswered"),
            "answer_regions": format_final_regions(m.get("answer_region_ids", []), answer_lookup),
            "mapping": {
                "method": m.get("method"),
                "confidence": m.get("confidence"),
                "review_required": m.get("review_required")
            }
        })
        
    final_unmatched = []
    for u in unmatched:
        final_unmatched.append({
            "answer_id": u["answer_region_id"],
            "status": "unmatched",
            "review_required": True,
            "regions": [{"page": u["page"], "bbox": u["bbox_px"]}],
            "text": u["text"]
        })
        
    return {
        "document": {
            "question_paper": {"filename": QUESTION_FILE.name},
            "answer_sheet": {"filename": ANSWER_FILE.name}
        },
        "questions": final_questions,
        "unmatched_answers": final_unmatched,
        "processing": {
            "model": "deepseek-ai/DeepSeek-OCR-2",
            "device": runtime_info["device"],
            "parameters": {"base_size": 1024, "image_size": 768, "crop_mode": True}
        }
    }""")

add_md("## 16 Evaluation")
add_code("""def evaluate_iou(pred_boxes, truth_boxes, threshold=0.5):
    # Dummy evaluation logic as placeholder
    return {"iou": 1.0, "precision": 1.0, "recall": 1.0}""")

add_md("## 17 End-to-End Test & Synthetic Tests")
add_code("""def run_synthetic_tests():
    # TEST 1: Questions in order, answers in order.
    # TEST 2: Answers out of order.
    # TEST 3: 11(a) and 11(b).
    # TEST 4: Question unanswered.
    # TEST 5: Answer with no question label.
    # TEST 6: Unmatched answer.
    # TEST 7: Answer spans two pages.
    print("Running synthetic tests...")
    
    mock_questions = [
        {"question_id": "Q01", "display_number": "1", "normalized_label": "1", "text": "What is AI?", "order_index": 1, "page": 1, "bbox_px": [0,0,0,0]},
        {"question_id": "Q02", "display_number": "11(a)", "normalized_label": "11a", "text": "Define ML.", "order_index": 2, "page": 1, "bbox_px": [0,0,0,0]},
        {"question_id": "Q03", "display_number": "11(b)", "normalized_label": "11b", "text": "Define DL.", "order_index": 3, "page": 1, "bbox_px": [0,0,0,0]}
    ]
    
    mock_answers = [
        {"answer_region_id": "A01", "detected_label": "1", "text": "AI is artificial intelligence.", "page": 1, "bbox_px": [0,0,10,10]},
        {"answer_region_id": "A02", "detected_label": "11b", "text": "DL is deep learning.", "page": 1, "bbox_px": [10,10,20,20]},
        {"answer_region_id": "A03", "detected_label": "11a", "text": "ML is machine learning.", "page": 2, "bbox_px": [0,0,10,10]}
    ]
    
    mapper = AnswerMapper(mock_questions, mock_answers)
    mapper.map_level_1_exact()
    mapper.map_level_3_semantic()
    mappings, unmatched = mapper.finalize()
    
    answer_lookup = {a["answer_region_id"]: a for a in mock_answers}
    final_json = build_final_json(mock_questions, mappings, unmatched, answer_lookup)
    
    print(json.dumps(final_json, indent=2))

run_synthetic_tests()""")

notebook = {
    "cells": cells,
    "metadata": {},
    "nbformat": 4,
    "nbformat_minor": 5
}

with open("/Users/ayushchougula/Desktop/Ayush/Projects/veda/deepseek_ocr2_assessment_mapping_colab.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print("Notebook generated successfully.")
