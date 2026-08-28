import pymupdf

# Question Paper
doc_qp = pymupdf.open('assets/Question_Paper.pdf')
page = doc_qp[0]
pix = page.get_pixmap(dpi=150)
pix.save('benchmark_experiments/mapping_visuals/Question_Paper_p001.png')

# Answer Sheet
doc_as = pymupdf.open('assets/Answer_Sheet.pdf')

pages_to_extract = [
    (2, 'Answer_Sheet_p003.png'),
    (4, 'Answer_Sheet_p005.png'),
    (14, 'Answer_Sheet_p015.png')
]

for idx, filename in pages_to_extract:
    page = doc_as[idx]
    pix = page.get_pixmap(dpi=150)
    pix.save(f'/Users/ayushchougula/.gemini/antigravity-ide/brain/b5fb7b39-9385-4edd-81eb-0d249c3fc147/images/{filename}')
    print(f'Saved {filename}')

print("Extraction complete.")
