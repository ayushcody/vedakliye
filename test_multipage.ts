import fs from 'fs';
import path from 'path';
import { extractAndGradeMistral } from './src/lib/mistral';

const artifactsDir = "/Users/ayushchougula/.gemini/antigravity-ide/brain/b5fb7b39-9385-4edd-81eb-0d249c3fc147/images";

function fileToDataUrl(filename: string) {
    const p = path.join(artifactsDir, filename);
    const base64 = fs.readFileSync(p).toString('base64');
    return `data:image/png;base64,${base64}`;
}

async function run() {
    console.log("Loading 22 benchmark images...");
    const qpPage = fileToDataUrl("Question_Paper_p001.png");
    const asPage = fileToDataUrl("Answer_Sheet_p001.png");

    const qpPages = [qpPage, qpPage];
    const asPages = Array.from({ length: 20 }, () => asPage);

    const expectedPages = qpPages.length + asPages.length;

    console.log(`Starting benchmark with ${expectedPages} pages...`);
    
    let ocrPagesProcessed = 0;
    
    const originalLog = console.log;
    console.log = function(...args) {
        if (typeof args[0] === 'string' && args[0].startsWith('Starting Mistral OCR 4.1 for')) {
            ocrPagesProcessed++;
        }
        originalLog.apply(console, args);
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async function(url, options) {
        if (url.toString().includes('ocr.process')) {
            return new Response(JSON.stringify({
                pages: [{ markdown: "mocked text", blocks: [] }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        if (url.toString().includes('chat/completions')) {
            return new Response(JSON.stringify({
                choices: [{ message: { content: JSON.stringify({ questions: [], orphanAnswers: [], summary: "Mocked" }) } }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        return originalFetch(url, options);
    };

    try {
        await extractAndGradeMistral(qpPages, asPages);
        
        console.log(`\nExpected pages: ${expectedPages}`);
        console.log(`Returned pages: ${ocrPagesProcessed}`);
        
        if (expectedPages !== ocrPagesProcessed) {
            console.error(`Missing pages: [test failed]`);
            process.exit(1);
        } else {
            console.log(`Missing pages: []`);
            console.log("Test passed: No silent truncation!");
        }
        
    } catch (e) {
        console.error("Benchmark failed:", e);
        process.exit(1);
    }
}

run();
