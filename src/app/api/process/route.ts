import { NextRequest } from "next/server";
import { extractAndGrade } from "@/lib/gemini";
import { extractAndGradeMistral } from "@/lib/mistral";
import type { ProcessRequestBody } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      function reportProgress(stepIndex: number, message: string) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "progress", stepIndex, message }) + "\n")
        );
      }

      try {
        const body = (await req.json()) as ProcessRequestBody & { engine?: "gemini" | "mistral" };

        if (!body.questionPaperPages?.length || !body.answerSheetPages?.length) {
          throw new Error("Both questionPaperPages and answerSheetPages are required.");
        }

        let result;
        if (body.engine === "mistral") {
          result = await extractAndGradeMistral(
            body.questionPaperPages,
            body.answerSheetPages,
            reportProgress
          );
        } else {
          // gemini doesn't have onProgress yet, just call it
          reportProgress(0, "Initializing Gemini engine...");
          result = await extractAndGrade(
            body.questionPaperPages,
            body.answerSheetPages
          );
        }

        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "result", data: result }) + "\n")
        );
        controller.close();
      } catch (err) {
        console.error("Processing error:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", error: message }) + "\n")
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
