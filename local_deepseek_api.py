import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import re
import ast
import json
import base64
from io import BytesIO
import time
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModel
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Globals & Engine Loading
# ---------------------------------------------------------------------------
class DeepSeekOCR2Engine:
    def __init__(self, model_id="Dogacel/Universal-DeepSeek-OCR-2"):
        self.model_id = model_id
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        self.tokenizer = None
        self.model = None

    def load(self):
        if self.model is not None:
            return
        print(f"Loading {self.model_id} on {self.device}...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id, trust_remote_code=True, use_fast=False
        )
        
        # Verify pad token isn't colliding with eos token in this tokenizer
        assert self.tokenizer.pad_token_id is not None, "Pad token ID is None!"
        assert self.tokenizer.pad_token_id != self.tokenizer.eos_token_id, "Tokenizer pad_token_id matches eos_token_id. Version mismatch!"

        self.model = AutoModel.from_pretrained(
            self.model_id,
            trust_remote_code=True,
            use_safetensors=True,
            _attn_implementation="eager",
            torch_dtype=torch.float16
        ).to(self.device).eval()
        
        # Set exact generation config
        self.model.generation_config.do_sample = False
        self.model.generation_config.max_new_tokens = 1024
        self.model.generation_config.eos_token_id = self.tokenizer.eos_token_id
        self.model.generation_config.pad_token_id = self.tokenizer.pad_token_id
        self.model.generation_config.no_repeat_ngram_size = 20
        self.model.generation_config.use_cache = True
        
        print("Model loaded successfully. Running self-test...")
        self.self_test()
        
    def self_test(self):
        # Create a tiny dummy image for self-test
        test_img_path = "/tmp/veda_deepseek_selftest.png"
        img = Image.new('RGB', (100, 100), color = 'white')
        img.save(test_img_path)
        
        out_dir = "/tmp/veda_deepseek_selftest_out"
        os.makedirs(out_dir, exist_ok=True)
        
        prompt = "<image>\n<|grounding|>Convert the document to markdown."
        self.model.infer(
            self.tokenizer, prompt=prompt, image_file=test_img_path, output_path=out_dir,
            base_size=1024, image_size=768, crop_mode=True, save_results=True,
            device=self.device, dtype=torch.float16
        )
        
        files = [f for f in os.listdir(out_dir) if f.endswith(".mmd")]
        if not files:
            raise RuntimeError("Self-test failed: No .mmd file generated.")
            
        with open(os.path.join(out_dir, files[0]), 'r', encoding='utf-8') as f:
            out_text = f.read()
            
        # Check for garbage generation (comma loops)
        if re.search(r'(,\s*){5,}', out_text):
            raise RuntimeError(f"Self-test failed: Garbage loop detected in output!\nOutput snippet: {out_text[:200]}")
            
        print("Self-test passed! Model is generating cleanly.")

engine = DeepSeekOCR2Engine()

# ---------------------------------------------------------------------------
# Logic
# ---------------------------------------------------------------------------

REF_DET_RE = re.compile(
    r"(?P<before>.*?)<\|ref\|>(?P<label>.*?)<\|/ref\|>\s*<\|det\|>(?P<det>.*?)<\|/det\|>", re.S
)

def safe_parse_list(value: str):
    try: return json.loads(value)
    except:
        try: return ast.literal_eval(value)
        except: return None

def decode_base64_image(data_url: str, page_num: int, tmp_dir: str):
    header, encoded = data_url.split(",", 1)
    img_data = base64.b64decode(encoded)
    img = Image.open(BytesIO(img_data)).convert("RGB")
    path = os.path.join(tmp_dir, f"page_{page_num}.png")
    img.save(path)
    return path, img.width, img.height

def infer_page(engine, image_path, prompt, base_size=1024, image_size=768, crop_mode=True):
    with torch.inference_mode():
        # Using deepseek's custom chat/inference api
        res = engine.model.chat(
            engine.tokenizer,
            prompt=prompt,
            image_file=str(image_path),
            base_size=base_size,
            image_size=image_size,
            crop_mode=crop_mode
        )
        # some versions of deepseek-ocr output slightly different chat formats, assuming it returns string
        # wait, the notebook uses engine.model.infer(...) and saves it. 
        # let's try chat directly or infer returning text.
        # Actually, in the notebook it wrote to output_path and we read it. Let's do that for safety.
        return res

def get_bounding_boxes(raw_text, page_index, source_type):
    records = []
    matches = REF_DET_RE.finditer(raw_text)
    for match in matches:
        label = match.group("label").strip()
        boxes = safe_parse_list(match.group("det").strip())
        if not isinstance(boxes, list): continue
        for box in boxes:
            if isinstance(box, list) and len(box) == 4:
                # 0-1000 coordinate system
                x1, y1, x2, y2 = [max(0.0, min(1000.0, float(v))) for v in box]
                # convert to fractional
                x = x1 / 1000.0
                y = y1 / 1000.0
                w = (x2 - x1) / 1000.0
                h = (y2 - y1) / 1000.0
                records.append({
                    "page": page_index,
                    "source_type": source_type,
                    "text": match.group("before").strip(),
                    "ref_label": label,
                    "bbox": {"x": x, "y": y, "w": w, "h": h}
                })
    return records

LABEL_PATTERNS = [
    re.compile(r"^\s*(?:q(?:uestion)?[\s\.\-]*)?(\d{1,3})\s*(?:[\(\[\-]?\s*([a-z])\s*[\)\]]?)", re.I),
    re.compile(r"^\s*q(?:uestion)?[\s\.\-]*(\d{1,3})\s*([a-z])", re.I),
    re.compile(r"^\s*(?:q(?:uestion)?[\s\.\-]*)?(\d{1,3})(?:[\.\)]|\s|$)", re.I)
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

import uuid
import hashlib
from fastapi import BackgroundTasks

class ProcessRequest(BaseModel):
    questionPaperPages: List[str]
    answerSheetPages: List[str]

# Global jobs store
jobs = {}

def get_image_cache_path(base64_url, tmp_dir):
    # Hash the base64 string to create a unique cache key
    h = hashlib.md5(base64_url.encode("utf-8")).hexdigest()
    return os.path.join(tmp_dir, f"cache_{h}.mmd")

def process_exam_worker(job_id: str, req: ProcessRequest):
    try:
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progressPercentage"] = 5
        
        # Load engine just in case it isn't loaded yet
        jobs[job_id]["message"] = "Warming up DeepSeek-OCR-2 engine..."
        engine.load()
        
        tmp_dir = "/tmp/veda_deepseek"
        os.makedirs(tmp_dir, exist_ok=True)
        
        total_pages = len(req.questionPaperPages) + len(req.answerSheetPages)
        if total_pages == 0:
            total_pages = 1 # Avoid division by zero
        processed_pages = 0
        
        # Process Questions
        question_records = []
        for i, q_url in enumerate(req.questionPaperPages):
            jobs[job_id]["message"] = f"Reading question paper (Page {i+1}/{len(req.questionPaperPages)})..."
            jobs[job_id]["stepIndex"] = 0
            
            cache_path = get_image_cache_path(q_url, tmp_dir)
            if os.path.exists(cache_path):
                print(f"[{job_id}] Cache hit for Question Page {i}")
                with open(cache_path, 'r', encoding='utf-8') as f:
                    raw_text = f.read()
            else:
                print(f"[{job_id}] Running inference for Question Page {i}")
                path, _, _ = decode_base64_image(q_url, i, tmp_dir)
                prompt = "<image>\n<|grounding|>Convert the document to markdown."
                out_dir = os.path.join(tmp_dir, f"q_{job_id}_{i}")
                
                engine.model.infer(
                    engine.tokenizer, prompt=prompt, image_file=path, output_path=out_dir,
                    base_size=1024, image_size=768, crop_mode=True, save_results=True,
                    device=engine.device, dtype=torch.float16
                )
                files = [f for f in os.listdir(out_dir) if f.endswith(".mmd")]
                if files:
                    with open(os.path.join(out_dir, files[0]), 'r', encoding='utf-8') as f:
                        raw_text = f.read()
                    # Save to cache
                    with open(cache_path, 'w', encoding='utf-8') as f:
                        f.write(raw_text)
                else:
                    raw_text = ""
                
            records = get_bounding_boxes(raw_text, i, "question")
            question_records.extend(records)
            
            processed_pages += 1
            jobs[job_id]["progressPercentage"] = int(5 + (processed_pages / total_pages) * 80)
            
        # Process Answers
        answer_records = []
        for i, a_url in enumerate(req.answerSheetPages):
            jobs[job_id]["message"] = f"Reading answer sheet (Page {i+1}/{len(req.answerSheetPages)})..."
            jobs[job_id]["stepIndex"] = 1
            
            cache_path = get_image_cache_path(a_url, tmp_dir)
            if os.path.exists(cache_path):
                print(f"[{job_id}] Cache hit for Answer Page {i}")
                with open(cache_path, 'r', encoding='utf-8') as f:
                    raw_text = f.read()
            else:
                print(f"[{job_id}] Running inference for Answer Page {i}")
                path, _, _ = decode_base64_image(a_url, i, tmp_dir)
                prompt = "<image>\n<|grounding|>Convert the document to markdown."
                out_dir = os.path.join(tmp_dir, f"a_{job_id}_{i}")
                
                try:
                    engine.model.infer(
                        engine.tokenizer, prompt=prompt, image_file=path, output_path=out_dir,
                        base_size=1024, image_size=768, crop_mode=True, save_results=True,
                        device=engine.device, dtype=torch.float16
                    )
                    files = [f for f in os.listdir(out_dir) if f.endswith(".mmd")]
                    if files:
                        with open(os.path.join(out_dir, files[0]), 'r', encoding='utf-8') as f:
                            raw_text = f.read()
                        # Save to cache
                        with open(cache_path, 'w', encoding='utf-8') as f:
                            f.write(raw_text)
                    else:
                        raw_text = ""
                except Exception as e:
                    print(f"[{job_id}] Error on answer page:", e)
                    raw_text = ""
            records = get_bounding_boxes(raw_text, i, "answer")
            answer_records.extend(records)
            
            processed_pages += 1
            jobs[job_id]["progressPercentage"] = int(5 + (processed_pages / total_pages) * 80)
            
        jobs[job_id]["message"] = "Mapping answers to questions..."
        jobs[job_id]["stepIndex"] = 2
        jobs[job_id]["progressPercentage"] = 90
        
        # Extract Questions
        questions_formatted = []
        for i, row in enumerate(question_records, start=1):
            candidates = [row.get("text", ""), row.get("ref_label", "")]
            qlabel = next((normalize_question_label(c) for c in candidates if normalize_question_label(c)), None)
            number = qlabel if qlabel else row.get("ref_label")
            questions_formatted.append({
                "id": f"Q{i:03d}",
                "number": number,
                "text": row["text"],
                "maxMarks": 5, # default
                "status": "unanswered",
                "score": 0,
                "feedback": "Needs grading",
                "transcribedAnswer": "",
                "regions": [],
                "normalized_label": qlabel,
            })
            
        # Extract Answers and map
        for a in answer_records:
            a_text = a.get("text", "")
            a_label = a.get("ref_label", "")
            qlabel = normalize_question_label(a_label) or normalize_question_label(a_text)
            
            mapped = False
            if qlabel:
                # Find matching question
                for q in questions_formatted:
                    if q["normalized_label"] == qlabel:
                        q["regions"].append({
                            "page": a["page"],
                            "bbox": a["bbox"]
                        })
                        q["status"] = "answered"
                        q["transcribedAnswer"] += a_text + "\n"
                        mapped = True
                        break
                        
        # Cleanup internal keys
        for q in questions_formatted:
            q.pop("normalized_label", None)

        jobs[job_id]["message"] = "Grading & generating feedback..."
        jobs[job_id]["stepIndex"] = 3
        jobs[job_id]["progressPercentage"] = 95
        
        final_result = {
            "questions": questions_formatted,
            "orphanAnswers": [],
            "totalScore": sum(q["score"] for q in questions_formatted),
            "totalMaxMarks": sum(q["maxMarks"] for q in questions_formatted),
            "summary": "DeepSeek OCR extracted and mapped the answers via exact label matching. Local execution."
        }
        
        jobs[job_id]["progressPercentage"] = 100
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = final_result
        print(f"[{job_id}] Completed successfully.")
        
    except Exception as e:
        print(f"[{job_id}] Error during inference:", e)
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


@app.post("/process-start")
async def start_process(req: ProcessRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "pending",
        "message": "Initializing...",
        "progressPercentage": 0,
        "stepIndex": 0,
        "result": None,
        "error": None
    }
    background_tasks.add_task(process_exam_worker, job_id, req)
    return {"jobId": job_id}

@app.get("/process-status/{job_id}")
async def get_process_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return jobs[job_id]

# Keep old process route as fallback for now
@app.post("/process")
async def old_process_exam(req: ProcessRequest):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {}
    process_exam_worker(job_id, req)
    if jobs[job_id].get("status") == "failed":
        raise HTTPException(status_code=500, detail=jobs[job_id].get("error"))
    return jobs[job_id].get("result")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
