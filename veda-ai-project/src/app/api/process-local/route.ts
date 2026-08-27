import { NextRequest, NextResponse } from "next/server";
import type { ProcessRequestBody } from "@/lib/types";

export const maxDuration = 300; // 5 minutes (DeepSeek local processing can take a while)

import http from "http";

function makeLocalRequest(payload: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 8000,
        path: "/process",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 15 * 60 * 1000, // 15 minutes timeout
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error("Failed to parse JSON response"));
            }
          } else {
            reject(new Error(`Local backend error: ${data}`));
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 15 minutes"));
    });
    req.on("error", (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProcessRequestBody;

    if (
      !body.questionPaperPages?.length ||
      !body.answerSheetPages?.length
    ) {
      return NextResponse.json(
        { error: "Both questionPaperPages and answerSheetPages are required." },
        { status: 400 }
      );
    }

    // Hit the local backend's start-process endpoint
    const localRes = await fetch("http://127.0.0.1:8000/process-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!localRes.ok) {
      const errorText = await localRes.text();
      throw new Error(`Local backend error: ${errorText}`);
    }

    const result = await localRes.json();
    return NextResponse.json(result); // { jobId: "..." }

  } catch (err) {
    console.error("Local processing error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
