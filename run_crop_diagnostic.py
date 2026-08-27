import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import time
from PIL import Image
import torch

from local_deepseek_api import DeepSeekOCR2Engine

def crop_image(img_path, top_pct=None, bottom_pct=None, out_path=None):
    img = Image.open(img_path).convert("RGB")
    w, h = img.size
    
    if top_pct is not None:
        # crop top N%
        crop_h = int(h * top_pct / 100)
        box = (0, 0, w, crop_h)
    elif bottom_pct is not None:
        # crop bottom N%
        crop_h = int(h * bottom_pct / 100)
        box = (0, h - crop_h, w, h)
    else:
        box = (0, 0, w, h)
        
    cropped = img.crop(box)
    cropped.save(out_path)
    return out_path

def main():
    exp_dir = "benchmark_experiments/boundary_crop_diagnostic"
    
    full_page_dir = os.path.join(exp_dir, "full_page")
    top_dir = os.path.join(exp_dir, "top_boundary")
    bottom_dir = os.path.join(exp_dir, "bottom_boundary")
    
    os.makedirs(full_page_dir, exist_ok=True)
    os.makedirs(top_dir, exist_ok=True)
    os.makedirs(bottom_dir, exist_ok=True)
    
    source_img = "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p001.png"
    
    # Create cropped images
    full_img_path = os.path.join(full_page_dir, "image.png")
    Image.open(source_img).convert("RGB").save(full_img_path)
    
    top_img_path = os.path.join(top_dir, "image.png")
    crop_image(source_img, top_pct=20, out_path=top_img_path)
    
    bottom_img_path = os.path.join(bottom_dir, "image.png")
    crop_image(source_img, bottom_pct=20, out_path=bottom_img_path)
    
    engine = DeepSeekOCR2Engine()
    engine.load()
    
    variants = [
        ("Full Page", full_img_path, full_page_dir),
        ("Top Boundary", top_img_path, top_dir),
        ("Bottom Boundary", bottom_img_path, bottom_dir)
    ]
    
    prompt = "<image>\n<|grounding|>Convert the document to markdown."
    
    for name, img_path, out_dir in variants:
        print(f"Running inference for {name}...")
        start_time = time.time()
        
        engine.model.infer(
            engine.tokenizer, prompt=prompt, image_file=img_path, output_path=out_dir,
            base_size=1024, image_size=768, crop_mode=True, save_results=True,
            device=engine.device, dtype=torch.float16
        )
        
        elapsed = time.time() - start_time
        print(f"  Done in {elapsed:.1f}s")
        
        with open(os.path.join(out_dir, "time.txt"), "w") as f:
            f.write(str(elapsed))

if __name__ == "__main__":
    main()
