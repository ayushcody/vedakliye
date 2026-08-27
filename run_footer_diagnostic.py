import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import time
from PIL import Image, ImageEnhance, ImageFilter
import torch
import psutil

from local_deepseek_api import DeepSeekOCR2Engine

def process_variant(img, variant):
    # A. Original
    if variant == "A":
        return img
    # B. 2x
    elif variant == "B":
        return img.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    # C. 3x
    elif variant == "C":
        return img.resize((img.width * 3, img.height * 3), Image.Resampling.LANCZOS)
    # D. 4x
    elif variant == "D":
        return img.resize((img.width * 4, img.height * 4), Image.Resampling.LANCZOS)
    # E. Grayscale + 2x
    elif variant == "E":
        return img.convert("L").convert("RGB").resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    # F. Contrast + 2x
    elif variant == "F":
        enhanced = ImageEnhance.Contrast(img).enhance(2.0)
        return enhanced.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    # G. Sharpened + 2x
    elif variant == "G":
        sharpened = img.filter(ImageFilter.SHARPEN)
        return sharpened.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    # H. Threshold/binarized + 2x
    elif variant == "H":
        gray = img.convert("L")
        thresholded = gray.point(lambda p: p > 128 and 255)
        return thresholded.convert("RGB").resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    # I. Contrast + Sharpened + 2x
    elif variant == "I":
        enhanced = ImageEnhance.Contrast(img).enhance(2.0)
        sharpened = enhanced.filter(ImageFilter.SHARPEN)
        return sharpened.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)

def main():
    exp_dir = "benchmark_experiments/footer_diagnostic"
    os.makedirs(exp_dir, exist_ok=True)
    
    source_img = "deepseek_ocr2_assessment/pages/answers/Answer_Sheet_p001.png"
    img = Image.open(source_img).convert("RGB")
    w, h = img.size
    
    # Bottom 20% crop
    crop_h = int(h * 20 / 100)
    box = (0, h - crop_h, w, h)
    base_crop = img.crop(box)
    
    engine = DeepSeekOCR2Engine()
    engine.load()
    
    variants = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
    variant_names = {
        "A": "Original bottom 20% crop",
        "B": "Bottom 20% crop enlarged 2x",
        "C": "Bottom 20% crop enlarged 3x",
        "D": "Bottom 20% crop enlarged 4x",
        "E": "Grayscale + 2x enlargement",
        "F": "Contrast-enhanced + 2x enlargement",
        "G": "Sharpened + 2x enlargement",
        "H": "Threshold/binarized + 2x enlargement",
        "I": "Contrast-enhanced + sharpened + 2x enlargement"
    }
    
    prompt = "<image>\n<|grounding|>Convert the document to markdown."
    process = psutil.Process(os.getpid())
    
    for v in variants:
        print(f"\nRunning variant {v}: {variant_names[v]}")
        out_dir = os.path.join(exp_dir, v)
        os.makedirs(out_dir, exist_ok=True)
        
        proc_img = process_variant(base_crop, v)
        img_path = os.path.join(out_dir, "image.png")
        proc_img.save(img_path)
        
        mem_before = process.memory_info().rss / (1024 * 1024)
        start_time = time.time()
        
        engine.model.infer(
            engine.tokenizer, prompt=prompt, image_file=img_path, output_path=out_dir,
            base_size=1024, image_size=768, crop_mode=True, save_results=True,
            device=engine.device, dtype=torch.float16
        )
        
        elapsed = time.time() - start_time
        mem_after = process.memory_info().rss / (1024 * 1024)
        mem_used = mem_after - mem_before
        
        print(f"  Dimensions: {proc_img.size}")
        print(f"  Time: {elapsed:.1f}s, Mem Diff: {mem_used:.1f}MB")
        
        # Read result
        files = [f for f in os.listdir(out_dir) if f.endswith(".mmd")]
        out_text = ""
        if files:
            with open(os.path.join(out_dir, files[0]), "r") as f:
                out_text = f.read()
        print(f"  Output: {out_text.strip()}")

if __name__ == "__main__":
    main()
