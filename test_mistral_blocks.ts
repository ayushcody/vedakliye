import { Mistral } from '@mistralai/mistralai';
async function run() {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  const response = await client.ocr.process({
    model: "mistral-ocr-4-1",
    document: {
      type: "image_url",
      imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    },
    includeBlocks: true
  });
  console.log(JSON.stringify(response.pages[0].blocks, null, 2));
}
run();
