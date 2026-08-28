import pymupdf
import os
import json

os.makedirs('extracted_full_pages/qp', exist_ok=True)
os.makedirs('extracted_full_pages/as', exist_ok=True)

doc_qp = pymupdf.open('assets/Question_Paper.pdf')
qp_pages = []
for i in range(len(doc_qp)):
    page = doc_qp[i]
    pix = page.get_pixmap(dpi=150)
    out_path = f'extracted_full_pages/qp/qp_p{i+1:03d}.png'
    pix.save(out_path)
    qp_pages.append(out_path)
print(f"Extracted {len(doc_qp)} QP pages.")

doc_as = pymupdf.open('assets/Answer_Sheet.pdf')
as_pages = []
for i in range(len(doc_as)):
    page = doc_as[i]
    pix = page.get_pixmap(dpi=150)
    out_path = f'extracted_full_pages/as/as_p{i+1:03d}.png'
    pix.save(out_path)
    as_pages.append(out_path)
print(f"Extracted {len(doc_as)} AS pages.")

metadata = {
    "qp_count": len(doc_qp),
    "as_count": len(doc_as)
}
with open('extracted_full_pages/meta.json', 'w') as f:
    json.dump(metadata, f, indent=2)
