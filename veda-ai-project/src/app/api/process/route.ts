import { NextRequest, NextResponse } from "next/server";
import { extractAndGrade } from "@/lib/gemini";
import type { ProcessRequestBody } from "@/lib/types";

export const maxDuration = 60;

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

    const result = await extractAndGrade(
      body.questionPaperPages,
      body.answerSheetPages
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Processing error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
