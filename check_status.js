const url = "https://veda.ayushchougula.in/api/process";

// A tiny 1x1 pixel blank image
const dummyImg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function checkStatus(engine) {
  console.log(`\nTesting ${engine.toUpperCase()} engine...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        engine: engine,
        questionPaperPages: [dummyImg],
        answerSheetPages: [dummyImg]
      })
    });

    if (!res.ok) {
      console.log(`❌ HTTP Error: ${res.status} ${res.statusText}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === "progress") {
            process.stdout.write("."); // Print dot for progress
          } else if (data.type === "result") {
            console.log(`\n✅ ${engine.toUpperCase()} is ONLINE and working!`);
            return;
          } else if (data.type === "error") {
            console.log(`\n❌ API Error: ${data.error}`);
            return;
          }
        } catch (e) {
          // ignore incomplete lines
        }
      }
    }
    console.log(`\n❌ Stream closed before finishing.`);
  } catch (err) {
    console.log(`\n❌ Connection failed: ${err.message}`);
  }
}

async function run() {
  console.log("Checking Veda API Status...");
  await checkStatus("gemini");
  await checkStatus("mistral");
}

run();
