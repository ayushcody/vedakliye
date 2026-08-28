import { extractAndGradeMistral } from './src/lib/mistral';
import * as fs from 'fs';
import * as path from 'path';

// Load env variables if any or hardcode for test if needed, but the Next.js process normally handles it. 

async function runTest() {
  const imageDir = '/Users/ayushchougula/.gemini/antigravity-ide/brain/b5fb7b39-9385-4edd-81eb-0d249c3fc147/images';
  
  const toDataURL = (filename: string) => {
    const data = fs.readFileSync(path.join(imageDir, filename));
    return `data:image/png;base64,${data.toString('base64')}`;
  };

  const qpPages = [toDataURL('Question_Paper_p001.png')];
  const asPages = [
    toDataURL('Answer_Sheet_p003.png'),
    toDataURL('Answer_Sheet_p005.png'),
    toDataURL('Answer_Sheet_p015.png')
  ];

  console.log('Running extractAndGradeMistral on the 3 selected pages...');
  
  try {
    const result = await extractAndGradeMistral(qpPages, asPages, (step, msg) => {
      console.log(`[Progress ${step}]: ${msg}`);
    });
    
    fs.mkdirSync('benchmark_experiments/mapping_visuals', { recursive: true });
    fs.writeFileSync('benchmark_experiments/mapping_visuals/mistral_result.json', JSON.stringify(result, null, 2));
    console.log('Test completed successfully. Result saved to mistral_result.json.');
  } catch (err) {
    console.error('Error running test:', err);
  }
}

runTest();
