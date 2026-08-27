import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import time
import json
import torch
import gc
from local_deepseek_api import DeepSeekOCR2Engine

def run_benchmark():
    engine = DeepSeekOCR2Engine()
    print("Loading engine...")
    engine.load()
    
    images = [
        "deepseek_ocr2_assessment/pages/questions/Question_Paper_p001.png",
        "deepseek_ocr2_assessment/pages/questions/Question_Paper_p002.png",
        "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p001.png",
        "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p008.png",
        "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p012.png",
        "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p020.png"
    ]
    
    out_dir = "benchmark_results"
    os.makedirs(out_dir, exist_ok=True)
    
    stats = []
    
    for i, img_path in enumerate(images):
        if not os.path.exists(img_path):
            print(f"Skipping {img_path} (not found)")
            continue
            
        print(f"\nProcessing {img_path}...")
        prompt = "<image>\n<|grounding|>Convert the document to markdown."
        page_out = os.path.join(out_dir, f"out_{i}")
        os.makedirs(page_out, exist_ok=True)
        
        torch.mps.empty_cache()
        gc.collect()
        
        start_time = time.time()
        
        error = None
        try:
            engine.model.infer(
                engine.tokenizer, prompt=prompt, image_file=img_path, output_path=page_out,
                base_size=1024, image_size=768, crop_mode=True, save_results=True,
                device=engine.device, dtype=torch.float16
            )
        except Exception as e:
            error = str(e)
            
        inf_time = time.time() - start_time
        
        # Read the raw output
        raw_text = ""
        try:
            files = [f for f in os.listdir(page_out) if f.endswith(".mmd")]
            if files:
                with open(os.path.join(page_out, files[0]), "r", encoding="utf-8") as f:
                    raw_text = f.read()
        except:
            pass
            
        # check repetition corruption
        # A simple heuristic: if a 5-gram is repeated more than 5 times consecutively, it's corrupted.
        # But we can just inspect manually or log the raw length.
        
        print(f"Time: {inf_time:.2f}s | Output Length: {len(raw_text)} | Error: {error}")
        
        stats.append({
            "file": img_path,
            "time_sec": inf_time,
            "error": error,
            "raw_text": raw_text,
            "out_folder": page_out
        })
        
    with open(os.path.join(out_dir, "stats.json"), "w") as f:
        json.dump(stats, f, indent=2)

if __name__ == "__main__":
    run_benchmark()
