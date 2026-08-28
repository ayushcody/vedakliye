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
    console.log("Loading benchmark images...");
    const qpPages = [
        fileToDataUrl("Question_Paper_p001.png"),
        fileToDataUrl("Question_Paper_p002.png")
    ];

    const asPages = [
        fileToDataUrl("Answer_Sheet_p001.png"),
        fileToDataUrl("Answer_Sheet_p008.png"),
        fileToDataUrl("Answer_Sheet_p012.png"),
        fileToDataUrl("Answer_Sheet_p020.png")
    ];

    console.log("Starting benchmark...");
    const startTime = Date.now();
    
    try {
        const result = await extractAndGradeMistral(qpPages, asPages);
        const elapsed = (Date.now() - startTime) / 1000;
        
        console.log(`Benchmark completed in ${elapsed.toFixed(2)} seconds.`);
        
        const outputPath = path.join(process.cwd(), "benchmark_result_raw.json");
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        console.log("Saved raw result to benchmark_result_raw.json");
    } catch (e) {
        console.error("Benchmark failed:", e);
    }
}

run();
