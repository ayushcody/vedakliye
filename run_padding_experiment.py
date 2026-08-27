import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import time
from PIL import Image, ImageOps
import torch
import psutil

from local_deepseek_api import DeepSeekOCR2Engine

def add_padding(image_path, padding_pct, output_path):
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    pad_w = int(w * padding_pct / 100)
    pad_h = int(h * padding_pct / 100)
    
    # Pad with white color
    padded = ImageOps.expand(img, border=(pad_w, pad_h, pad_w, pad_h), fill='white')
    padded.save(output_path)
    return output_path

def main():
    exp_dir = "benchmark_experiments/boundary_padding"
    os.makedirs(exp_dir, exist_ok=True)
    
    # We will test on Answer_Sheet_p001.png because it missed both header and footer.
    images_to_test = [
        "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p001.png",
    ]
    
    padding_variants = [0, 2, 4, 6, 8]
    
    engine = DeepSeekOCR2Engine()
    engine.load()
    
    process = psutil.Process(os.getpid())
    
    for img_path in images_to_test:
        basename = os.path.basename(img_path).replace(".png", "")
        print(f"Testing {basename}...")
        
        for p in padding_variants:
            print(f"  Variant: {p}% padding")
            variant_dir = os.path.join(exp_dir, f"{basename}_pad{p}")
            os.makedirs(variant_dir, exist_ok=True)
            
            padded_img_path = os.path.join(variant_dir, f"padded_{p}.png")
            
            if p == 0:
                img = Image.open(img_path).convert("RGB")
                img.save(padded_img_path)
            else:
                add_padding(img_path, p, padded_img_path)
                
            prompt = "<image>\n<|grounding|>Convert the document to markdown."
            
            mem_before = process.memory_info().rss / (1024 * 1024)
            start_time = time.time()
            engine.model.infer(
                engine.tokenizer, prompt=prompt, image_file=padded_img_path, output_path=variant_dir,
                base_size=1024, image_size=768, crop_mode=True, save_results=True,
                device=engine.device, dtype=torch.float16
            )
            elapsed = time.time() - start_time
            mem_after = process.memory_info().rss / (1024 * 1024)
            mem_used = mem_after - mem_before
            
            print(f"    Done in {elapsed:.1f}s, Mem Diff: {mem_used:.1f}MB")
            
            with open(os.path.join(variant_dir, "metrics.txt"), "w") as f:
                f.write(f"time:{elapsed}\nmem_diff:{mem_used}\n")

if __name__ == "__main__":
    main()
