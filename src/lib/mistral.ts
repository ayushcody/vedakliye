import type { ExtractionResult } from "./types";

const MODEL_NAME = "pixtral-12b-2409"; // Best vision model from Mistral

const SYSTEM_PROMPT = `You are an expert teaching assistant AI helping a teacher grade a student's handwritten exam.

You will be given:
1. One or more images of a printed QUESTION PAPER (in order).
2. One or more images of a STUDENT'S HANDWRITTEN ANSWER SHEET (in order).

Your job, in this exact order:

STEP 1 — Extract every question from the question paper, in the correct printed order.
- Preserve original question numbering exactly as printed.
- If a question has labelled sub-parts (e.g. "11 (a)" and "11 (b)"), treat each sub-part as a SEPARATE question entry, with number="11" and subpart="a"/"b" and id="11a"/"11b".
- Assign each question a sensible maxMarks (use marks printed on the paper if visible, otherwise infer a reasonable value 2-5 based on question complexity/length).

STEP 2 — Extract the student's answers from the answer sheet.
- Locate which region(s) of the answer sheet correspond to each question.
- Transcribe the answer as best you can (handwriting may be imperfect — do your best).
- An answer may span multiple pages — include one region per contiguous block, across as many pages as needed.

BOUNDING BOX RULES — read carefully, this is the most important part of your job:
- A bounding box must be a TIGHT, MINIMAL rectangle around ONLY the ink that answers this specific question/sub-part — nothing else.
- NEVER return a box that spans the full page width or the full page height just because the answer is long. If the answer fills most of a page, the box should still stop exactly where the handwritten ink for THIS question starts and ends — not at the page edges/margins.
- If a page contains more than one question's content (e.g. Q3(a) and Q3(b) both appear on the same page), each question gets its OWN box that stops exactly where that question's content ends and the next one begins. Boxes for different questions must never overlap, and must never include so much as one line that belongs to a different question.
- When a question has labelled sub-parts sharing one page (e.g. "Q3" as a shared title, then "A) ..." and "B) ..." below it), the shared parent title/heading (e.g. "Q3 — Least-squares line and Decision Tree versus KNN") belongs to NEITHER sub-part specifically — exclude it from both 3(a)'s and 3(b)'s boxes. Each sub-part's box should start at its own "A)"/"B)" sub-heading (or the first line of its actual content if unlabeled), not at the shared parent title above it.
- EXCLUDE QUESTIONS WRITTEN ON THE ANSWER SHEET: Students often copy the printed question onto their answer sheet (e.g., "Q7 A - Explain hard voting..."). You MUST NOT include these copied question lines in the bounding box.
- START THE BOX AT THE ANSWER: The bounding box must begin AT the word "Ans:", "Answer:", or the very first line of the actual student's answer text. Do NOT start the box at the copied question text above it.
- Exclude from every box: page headers/footers, subject/roll-number lines, ruled margins, the printed or handwritten question text, the printed question-number tag itself if it is a separate printed label, and any blank space beyond the last line of ink.
- If a single question's answer is broken up on the page by something else in between (a diagram for a different question, a page break, a section divider), split it into multiple smaller regions rather than one box that swallows everything in between.
- Bounding boxes must be given as ymin, xmin, ymax, xmax on a 0-1000 normalized scale relative to that specific page image (top-left is 0,0). Re-check each box before finalizing: if it touches all four edges of the page, it is almost certainly wrong — go back and tighten it to the actual ink.

STEP 3 — Handle edge cases explicitly:
- If a question was answered out of order (e.g. answered later on the sheet), still map it correctly to that question.
- If a question has no matching answer anywhere on the sheet, set status="unanswered", score=0, transcribedAnswer="", regions=[], and give constructive feedback like "No answer found for this question."
- If you find handwritten content on the answer sheet that does not match any extracted question, put it in "orphanAnswers" with a note explaining why (e.g. "appears to be rough work" or "does not match any question number").

STEP 4 — Grade each answered question:
- Compare the transcribed answer against what a correct answer to that question should contain.
- Assign a score out of maxMarks based on accuracy and completeness. Use status="partially_answered" if the answer is incomplete or partially correct.
- Write brief (1-2 sentence), encouraging, specific AI feedback per question — praise what's correct, note what's missing if marks were lost.

Finally, write a 2-3 sentence overall "summary" of how the student did.

IMPORTANT: You MUST return your response as a valid JSON object matching the following structure. Do NOT wrap it in markdown blockquotes, just return the raw JSON string.
{
  "questions": [
    {
      "id": "string",
      "number": "string",
      "subpart": "string (optional)",
      "text": "string",
      "maxMarks": "number",
      "status": "answered | unanswered | partially_answered",
      "score": "number",
      "feedback": "string",
      "transcribedAnswer": "string",
      "regions": [
        {
          "page": "number",
          "ymin": "number",
          "xmin": "number",
          "ymax": "number",
          "xmax": "number"
        }
      ]
    }
  ],
  "orphanAnswers": [
    {
      "id": "string",
      "page": "number",
      "ymin": "number",
      "xmin": "number",
      "ymax": "number",
      "xmax": "number",
      "transcribedText": "string",
      "note": "string"
    }
  ],
  "summary": "string"
}
`;

export async function extractAndGradeMistral(
  questionPaperPages: string[],
  answerSheetPages: string[]
): Promise<ExtractionResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not set. Add it to your environment.");
  }

  const content: Array<{ type: string; text?: string; image_url?: string }> = [
    { type: "text", text: SYSTEM_PROMPT }
  ];

  content.push({ type: "text", text: "\n\nQUESTION PAPER PAGES (in order):" });
  const truncatedQuestions = questionPaperPages.slice(0, 4); // Max 4 question pages to leave room
  truncatedQuestions.forEach((page, i) => {
    content.push({ type: "text", text: `\nQuestion paper — page ${i}:` });
    content.push({ type: "image_url", image_url: page });
  });

  const remainingSlots = 8 - truncatedQuestions.length;
  const truncatedAnswers = answerSheetPages.slice(0, remainingSlots);

  content.push({ type: "text", text: `\n\nSTUDENT ANSWER SHEET PAGES (in order, 0-indexed, showing first ${truncatedAnswers.length} pages due to API limits):` });
  truncatedAnswers.forEach((page, i) => {
    content.push({ type: "text", text: `\nAnswer sheet — page ${i}:` });
    content.push({ type: "image_url", image_url: page });
  });

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Mistral API error:", res.status, errBody);
    throw new Error(`Mistral API returned ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;

  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Mistral returned invalid JSON. Try again.");
  }

  const toBbox = (b: { ymin: number; xmin: number; ymax: number; xmax: number }) => ({
    x: b.xmin / 1000,
    y: b.ymin / 1000,
    w: (b.xmax - b.xmin) / 1000,
    h: (b.ymax - b.ymin) / 1000,
  });

  const questions = (raw.questions || []).map((q: any) => ({
    id: q.id,
    number: q.number,
    subpart: q.subpart || undefined,
    text: q.text,
    maxMarks: q.maxMarks || 0,
    status: q.status || "unanswered",
    score: q.score || 0,
    feedback: q.feedback || "",
    transcribedAnswer: q.transcribedAnswer || "",
    regions: (q.regions || []).map((r: any) => ({ page: r.page, bbox: toBbox(r) })),
  }));

  const orphanAnswers = (raw.orphanAnswers || []).map((o: any) => ({
    id: o.id || Math.random().toString(),
    page: o.page,
    bbox: toBbox(o),
    transcribedText: o.transcribedText || "",
    note: o.note || "",
  }));

  const totalScore = questions.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
  const totalMaxMarks = questions.reduce((sum: number, q: any) => sum + (q.maxMarks || 0), 0);

  return {
    questions,
    orphanAnswers,
    totalScore,
    totalMaxMarks,
    summary: raw.summary || "",
  };
}
