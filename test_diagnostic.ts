import fs from 'fs';
import path from 'path';
import { Mistral } from '@mistralai/mistralai';

const artifactsDir = "/Users/ayushchougula/.gemini/antigravity-ide/brain/b5fb7b39-9385-4edd-81eb-0d249c3fc147/images";

function fileToDataUrl(filename: string) {
    const p = path.join(artifactsDir, filename);
    const base64 = fs.readFileSync(p).toString('base64');
    return `data:image/png;base64,${base64}`;
}

async function run() {
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const imgUrl = fileToDataUrl("Answer_Sheet_p001.png");
    
    console.log("Running OCR on Answer_Sheet_p001.png...");
    const response = await client.ocr.process({
        model: "mistral-ocr-4-1",
        document: { type: "image_url", imageUrl: imgUrl },
        includeBlocks: true,
        extractHeader: true,
        extractFooter: true
    });
    
    const page = response.pages[0];
    
    const hasHeader = (page.blocks || []).some(b => b.type === 'header');
    const hasFooter = (page.blocks || []).some(b => b.type === 'footer');
    
    const headerBlock = (page.blocks || []).find(b => b.type === 'header');
    const footerBlock = (page.blocks || []).find(b => b.type === 'footer');
    
    console.log(`Header detected: ${hasHeader ? 'YES' : 'NO'}`);
    if (hasHeader && headerBlock && 'content' in headerBlock) console.log(`Header text: ${headerBlock.content}`);
    
    console.log(`Footer detected: ${hasFooter ? 'YES' : 'NO'}`);
    if (hasFooter && footerBlock && 'content' in footerBlock) console.log(`Footer text: ${footerBlock.content}`);
}

run().catch(console.error);
