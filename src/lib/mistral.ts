import type { ExtractionResult, BoundingBox } from "./types";
import { Mistral } from '@mistralai/mistralai';

const OCR_MODEL = "mistral-ocr-4-1";
const PRIMARY_LLM_MODEL = "mistral-large-latest";
const FALLBACK_LLM_MODEL = "mistral-small-latest"; 

const SYSTEM_PROMPT = `You are an expert teaching assistant AI helping a teacher grade a student's handwritten exam.

You will be given the structured OCR text of:
1. A printed QUESTION PAPER.
2. A STUDENT'S HANDWRITTEN ANSWER SHEET.

Your job, in this exact order:

STEP 1 — Extract every question from the question paper, in the correct printed order.
- Preserve original question numbering exactly as printed.
- If a question has labelled sub-parts (e.g. "11 (a)" and "11 (b)"), treat each sub-part as a SEPARATE question entry, with number="11" and subpart="a"/"b" and id="11a"/"11b".
- Assign each question a sensible maxMarks (use marks printed on the paper if visible, otherwise infer a reasonable value 2-5 based on question complexity/length).

STEP 2 — Extract the student's answers from the answer sheet.
- Locate which region(s) of the answer sheet correspond to each question.
- MAPPING RULE: You MUST rely on explicit handwritten identifiers (e.g. "Q1A", "2(b)", "Ans 3") to map answers to questions. NEVER map based simply on the sequence or order of answers.
- CONTINUATIONS: "Q5 (cont.)" is NOT "Q5B". It means "continuation of Q5". Set isContinuation: true and normalizedLabel: "Q5_CONT". Do NOT guess subparts for a continuation.
- EXPLICIT LABEL PRIORITY: If a handwritten label explicitly says "Q1B", it MUST be mapped to the question with id "1b", regardless of its spatial position or whether "1a" was answered.
- If you find an answer with no clear label, attempt a confident context match. If unsafe, place it in "orphanAnswers".
- Transcribe ONLY the student's actual answer (exclude any copied question prompt or title).
- An answer may span multiple pages — include one region per contiguous block, across as many pages as needed.

BOUNDING BOX & BLOCK SELECTION RULES — read carefully, this is CRITICAL:
- You MUST specify the exact \`blockIds\` of the OCR blocks that contain ONLY the student's answer text and tables.
- EXCLUDE QUESTION HEADINGS, LABELS, AND COPIED QUESTIONS: Students often write "# Q2 - Customer Segmentation...", "Q1A", or copy the question title onto the answer sheet. You MUST EXCLUDE these question/title/header blocks from \`blockIds\`. The question label is recorded separately in \`rawLabel\`/\`extractedLabel\`, but MUST NOT be in \`blockIds\`.
- START AT THE ACTUAL ANSWER BODY: \`blockIds\` must start at the very first block of the student's actual answer content, NOT the question heading above it.
- DO NOT INCLUDE BLANK SPACE OR FOOTERS. Only include the specific \`blockIds\` that contain actual student answer text.
- INCLUDE ALL PARAGRAPHS AND EXPLANATIONS: A student's answer to a question (e.g. Q1A) often spans multiple paragraphs, application examples, bullet points, derivations, or diagrams. You MUST include ALL \`blockIds\` for all paragraphs belonging to that question until the next question header (e.g. 'Q1 B') begins. NEVER stop after the first paragraph or opening definition. The \`blockIds\` and \`transcribedAnswer\` must encompass the entire response (Paragraph 1, 2, 3, etc.).
- PREVENT CHARACTER CLIPPING: When computing each box's edges, err very slightly on the side of generous rather than exact — the box must fully contain every character's ink, including ascenders, descenders, and the leftmost/rightmost stroke of the first and last character on each line. A box that clips even a single character (e.g. rendering 'learn' as 'earn' by cutting off the 'l') is a real error, even if it's only 2-3 pixels of clipping. When in doubt about an edge, expand it outward by a few pixels rather than fitting exactly to the visible ink boundary.

STEP 3 — Handle edge cases explicitly:
- If a question was answered out of order, still map it correctly to that question using its label.
- If a question has no matching answer, set status="unanswered", score=0, transcribedAnswer="", regions=[], and give constructive feedback like "No answer found for this question."
- Do NOT shift answers to fill gaps left by unanswered questions.
- If you find handwritten content that does not match any extracted question, put it in "orphanAnswers".

STEP 4 — Grade each answered question:
- Compare the transcribed answer against what a correct answer to that question should contain.
- Assign a score out of maxMarks based on accuracy and completeness. Use status="partially_answered" if the answer is incomplete or partially correct.
- Write brief (1-2 sentence), encouraging, specific AI feedback per question.

Finally, write a 2-3 sentence overall "summary" of how the student did.

IMPORTANT: You MUST return your response as a valid JSON object matching the following structure. Do NOT wrap it in markdown blockquotes, just return the raw JSON string.
{
  "questions": [
    {
      "id": "string",
      "number": "string",
      "subpart": "string (optional)",
      "extractedLabel": "string (The actual handwritten question label you found on the page, e.g. 'Q1A'. null if none)",
      "normalizedLabel": "string (e.g. 'Q5A', 'Q5_CONT')",
      "text": "string",
      "maxMarks": "number",
      "status": "answered | unanswered | partially_answered",
      "score": "number",
      "feedback": "string",
      "transcribedAnswer": "string",
      "regions": [
        {
          "page": "number",
          "blockIds": ["string"],
          "rawLabel": "string",
          "normalizedLabel": "string",
          "isContinuation": "boolean",
          "mappingConfidence": "string (high | medium | low)"
        }
      ]
    }
  ],
  "orphanAnswers": [
    {
      "id": "string",
      "page": "number",
      "blockIds": ["string"],
      "transcribedText": "string",
      "note": "string"
    }
  ],
  "summary": "string"
}
`;

export async function extractAndGradeMistral(
  questionPaperPages: string[],
  answerSheetPages: string[],
  onProgress?: (step: number, message: string) => void
): Promise<ExtractionResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not configured.");
  }

  const client = new Mistral({ apiKey });
  const allBlocksMap = new Map<string, BoundingBox>();

  // 1. OCR Stage: Process all pages through Mistral OCR 4.1 in parallel
  async function processPageOCR(pageDataUrl: string, type: string, pageIndex: number, totalPages: number) {
    console.log(`[MISTRAL OCR] Starting ${type} page ${pageIndex + 1}/${totalPages}...`);
    let attempt = 0;
    const maxRetries = 5;
    let lastStatus = null;
    let lastErrorMessage = "";
    
    while (attempt < maxRetries) {
      attempt++;
      try {
        const response = await client.ocr.process({
          model: OCR_MODEL,
          document: {
            type: "image_url",
            imageUrl: pageDataUrl,
          },
          includeBlocks: true,
          extractHeader: true,
          extractFooter: true,
          tableFormat: "html",
          confidenceScoresGranularity: "block"
        });

        const page = response.pages[0]; 
        const pWidth = page.dimensions?.width || 1000;
        const pHeight = page.dimensions?.height || 1000;

        const normalizedBlocks = (page.blocks || []).map((b: any, idx: number) => {
          let bbox = null;
          if ("topLeftX" in b && "bottomRightX" in b) {
            bbox = {
              ymin: Math.round(((b.topLeftY || 0) / pHeight) * 1000),
              xmin: Math.round(((b.topLeftX || 0) / pWidth) * 1000),
              ymax: Math.round(((b.bottomRightY || 0) / pHeight) * 1000),
              xmax: Math.round(((b.bottomRightX || 0) / pWidth) * 1000),
            };
          }
          const blockId = `block_${type === "ANSWER SHEET" ? "as" : "qp"}_${pageIndex}_${idx}`;
          if (bbox) {
            allBlocksMap.set(blockId, {
              x: bbox.xmin / 1000,
              y: bbox.ymin / 1000,
              w: Math.max(0.01, (bbox.xmax - bbox.xmin) / 1000),
              h: Math.max(0.01, (bbox.ymax - bbox.ymin) / 1000)
            });
          }
          return {
            id: blockId,
            type: b.type,
            content: "content" in b ? b.content : "",
            bbox,
          };
        });
        
        let pageText = `--- ${type} PAGE ${pageIndex} ---\n`;
        pageText += `Markdown:\n${page.markdown}\n\n`;
        pageText += `Blocks (0-1000 normalized coordinates):\n${JSON.stringify(normalizedBlocks, null, 2)}\n`;
        
        console.log(`[MISTRAL OCR] Document: ${type} Pages: ${totalPages} Status: SUCCESS Processed page ${pageIndex + 1}`);
        return pageText;
      } catch (error: any) {
        lastStatus = error.statusCode || error.status || "UNKNOWN";
        lastErrorMessage = error.message || String(error);
        
        const isTransient = lastStatus === 429 || (typeof lastStatus === 'number' && lastStatus >= 500) || lastErrorMessage.includes('fetch failed') || lastErrorMessage.includes('ETIMEDOUT') || error.code === 'ETIMEDOUT';
        
        if (isTransient && attempt < maxRetries) {
          const jitter = Math.random() * 1000;
          const waitTime = (Math.pow(2, attempt) * 1000) + jitter; 
          console.log(`[MISTRAL OCR] Document: ${type} Pages: ${totalPages} Model: ${OCR_MODEL} Attempt: ${attempt}/${maxRetries} Status: ${lastStatus} Retrying in: ${(waitTime/1000).toFixed(1)}s`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (!isTransient) {
          console.error(`[MISTRAL OCR] Permanent error on ${type} page ${pageIndex + 1}:`, error);
          throw new Error(`MISTRAL_OCR_INVALID_REQUEST - Document: ${type}, Total Pages: ${totalPages}, Failed Page: ${pageIndex + 1}, Status: ${lastStatus}, Error: ${lastErrorMessage}`);
        }
      }
    }
    
    throw new Error(`MISTRAL_OCR_TRANSIENT_FAILURE (MISTRAL_OCR_INCOMPLETE) - Document: ${type}, Total Pages: ${totalPages}, Failed Page: ${pageIndex + 1}, Final Status: ${lastStatus}, Retries: ${maxRetries}, Error: ${lastErrorMessage}`);
  }

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const qpResults = [];
  for (let i = 0; i < questionPaperPages.length; i++) {
    if (onProgress) onProgress(0, `Mistral AI is reading question paper (page ${i + 1}/${questionPaperPages.length})...`);
    qpResults.push(await processPageOCR(questionPaperPages[i], "QUESTION PAPER", i, questionPaperPages.length));
    if (i < questionPaperPages.length - 1) await delay(1500);
  }

  const asResults = [];
  for (let i = 0; i < answerSheetPages.length; i++) {
    if (onProgress) onProgress(1, `Mistral AI is reading answer sheet (page ${i + 1}/${answerSheetPages.length})...`);
    asResults.push(await processPageOCR(answerSheetPages[i], "ANSWER SHEET", i, answerSheetPages.length));
    if (i < answerSheetPages.length - 1) await delay(1500);
  }

  console.log("Starting Mistral LLM mapping stage in batches...");

  const asBatches: string[][] = [];
  const BATCH_SIZE = 3;
  if (asResults.length === 0) {
    asBatches.push([]);
  } else {
    for (let i = 0; i < asResults.length; i += BATCH_SIZE) {
      asBatches.push(asResults.slice(i, i + BATCH_SIZE));
    }
  }

  const mergedQuestions = new Map<string, any>();
  const mergedOrphans: any[] = [];
  const summaries: string[] = [];

  for (let batchIdx = 0; batchIdx < asBatches.length; batchIdx++) {
    if (onProgress) onProgress(2, `Mistral AI is mapping and grading answers (batch ${batchIdx + 1}/${asBatches.length})...`);
    const batchAsResults = asBatches[batchIdx];
    
    const combinedOCRText = [
      "--- QUESTION PAPER OCR RESULTS (extract ALL questions from here) ---",
      ...qpResults,
      `--- ANSWER SHEET OCR RESULTS (Batch ${batchIdx + 1} of ${asBatches.length}) ---`,
      "NOTE: Only a portion of the answer sheet is provided in this batch. Map the answers found in this batch.",
      ...batchAsResults
    ].join("\n\n");

    const payloadCharCount = combinedOCRText.length;
    console.log(`[MISTRAL MAPPING] Batch: ${batchIdx + 1}/${asBatches.length} Pages: ${batchAsResults.length} Characters: ${payloadCharCount} Estimated tokens: ${Math.round(payloadCharCount / 4)}`);
    
    let attempt = 0;
    const maxRetries = 8;
    let res: any;
    let lastStatus = null;
    let lastErrorMessage = "";
    
    const batchStartTime = Date.now();
    while (attempt < maxRetries) {
      attempt++;
      const currentModel = attempt > 2 ? FALLBACK_LLM_MODEL : PRIMARY_LLM_MODEL;
      try {
        res = await client.chat.complete({
          model: currentModel,
          messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: combinedOCRText }
          ],
          responseFormat: { type: "json_object" },
          temperature: 0.2,
        });
        const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(1);
        console.log(`[MISTRAL MAPPING] Batch ${batchIdx + 1} SUCCESS in ${batchDuration}s (Model: ${currentModel})`);
        break; // Success
      } catch (error: any) {
        lastStatus = error.statusCode || error.status || "UNKNOWN";
        lastErrorMessage = error.message || String(error);
        
        const isTransient = lastStatus === 429 || lastStatus === 503 || lastStatus === 504 || (typeof lastStatus === 'number' && lastStatus >= 500) || lastErrorMessage.includes('fetch failed') || lastErrorMessage.includes('ETIMEDOUT') || lastErrorMessage.toLowerCase().includes('timeout') || error.code === 'ETIMEDOUT' || error.cause?.code === 'ETIMEDOUT';
        
        if (isTransient && attempt < maxRetries) {
          const jitter = Math.random() * 1000;
          const waitTime = lastStatus === 429 
            ? Math.min(60000, (attempt * 15000) + jitter)
            : (Math.pow(2, attempt) * 1000) + jitter;
          console.log(`[MISTRAL LLM] Transient error on mapping batch ${batchIdx + 1} (Status ${lastStatus}). Switching/Waiting ${(waitTime/1000).toFixed(1)}s (Attempt ${attempt}/${maxRetries}, next model: ${attempt >= 2 ? FALLBACK_LLM_MODEL : PRIMARY_LLM_MODEL})...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (!isTransient || attempt >= maxRetries) {
          throw new Error(`MISTRAL_LLM_TRANSIENT_FAILURE - Batch: ${batchIdx + 1}/${asBatches.length}, Final Status: ${lastStatus}, Retries: ${attempt}, Error: ${lastErrorMessage}`);
        }
      }
    }

    const text = res.choices?.[0]?.message?.content;
    if (!text) {
        throw new Error(`Mistral LLM returned empty response on batch ${batchIdx + 1}`);
    }

    let raw: any;
    try {
      raw = JSON.parse(text as string);
    } catch {
      throw new Error(`Mistral returned invalid JSON on batch ${batchIdx + 1}.`);
    }

    if (onProgress) onProgress(3, `Mistral AI is generating feedback (batch ${batchIdx + 1}/${asBatches.length})...`);
    for (const q of (raw.questions || [])) {
      const qId = String(q.id);
      const existing = mergedQuestions.get(qId);
      
      if (!existing || existing.status === "unanswered" || (existing.status === "partially_answered" && q.status === "answered")) {
        mergedQuestions.set(qId, q);
      } else if (existing && q.status !== "unanswered") {
        existing.regions = [...(existing.regions || []), ...(q.regions || [])];
        if (q.transcribedAnswer) existing.transcribedAnswer += "\n" + q.transcribedAnswer;
        if (q.score > (existing.score || 0)) existing.score = q.score;
        if (q.feedback) existing.feedback += " " + q.feedback;
      }
    }

    mergedOrphans.push(...(raw.orphanAnswers || []));
    if (raw.summary) summaries.push(raw.summary);
    if (batchIdx < asBatches.length - 1) await delay(3000);
  }

  // Deduplicate parent vs subpart questions:
  // If we have subparts (e.g. "1a", "1b"), remove redundant parent question (e.g. "1")
  const allMergedKeys = Array.from(mergedQuestions.keys());
  for (const qId of allMergedKeys) {
    const hasSubparts = allMergedKeys.some(
      (otherId) =>
        otherId !== qId &&
        otherId.toLowerCase().startsWith(qId.toLowerCase()) &&
        /[a-z]/i.test(otherId.slice(qId.length))
    );
    if (hasSubparts) {
      console.log(`[DEDUPLICATION] Removing redundant parent question "${qId}" because subparts exist.`);
      mergedQuestions.delete(qId);
    }
  }

  // Calculate union bounding box from blockIds
  const calculateUnionBbox = (blockIds: string[]) => {
    if (!blockIds || blockIds.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    let found = false;
    
    for (const id of blockIds) {
      const box = allBlocksMap.get(id);
      if (box) {
        found = true;
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.w);
        maxY = Math.max(maxY, box.y + box.h);
      }
    }
    
    if (!found) return { x: 0, y: 0, w: 0, h: 0 };
    
    return {
      x: minX,
      y: minY,
      w: Math.max(0.01, maxX - minX),
      h: Math.max(0.01, maxY - minY)
    };
  };

  // Resolve continuations
  let lastResolvedId: string | null = null;

  const finalQuestions = Array.from(mergedQuestions.values()).map((q: any) => {
    const qRegions = (q.regions || []).map((r: any) => {
      const bbox = calculateUnionBbox(r.blockIds);
      let note = r.note || "";
      
      // Calculate content area ratio to detect oversized boxes
      let contentArea = 0;
      for (const id of (r.blockIds || [])) {
        const box = allBlocksMap.get(id);
        if (box) contentArea += (box.w * box.h);
      }
      const bboxArea = bbox.w * bbox.h;
      if (bboxArea > 0 && (contentArea / bboxArea) < 0.1) {
        note += (note ? " | " : "") + "OVERSIZED_ANSWER_REGION";
      }
      
      let resMethod = r.isContinuation ? "unresolved" : "explicit_label";
      let resQuestionId = null;
      if (r.isContinuation && lastResolvedId) {
        resMethod = "continuation_context";
        resQuestionId = lastResolvedId;
      } else if (!r.isContinuation) {
        lastResolvedId = q.id;
      }
      
      return {
        page: r.page,
        bbox,
        rawLabel: r.rawLabel || q.extractedLabel || null,
        normalizedLabel: r.normalizedLabel || q.normalizedLabel || null,
        isContinuation: !!r.isContinuation,
        resolvedQuestionId: resQuestionId,
        resolutionMethod: resMethod,
        blockIds: r.blockIds || [],
        mappingConfidence: r.mappingConfidence || "high",
        note
      };
    });
    
    return {
      id: q.id,
      number: q.number,
      subpart: q.subpart || undefined,
      extractedLabel: q.extractedLabel || null,
      text: q.text,
      maxMarks: q.maxMarks || 0,
      status: q.status || "unanswered",
      score: q.score || 0,
      feedback: q.feedback || "",
      transcribedAnswer: q.transcribedAnswer || "",
      regions: qRegions,
    };
  });

  // Pass 2: Verify & correct geometry separation for pages with 2+ regions
  const pageRegionsMap = new Map<number, { qIndex: number; rIndex: number; region: any }[]>();
  finalQuestions.forEach((q, qIndex) => {
    q.regions.forEach((r: any, rIndex: number) => {
      if (!pageRegionsMap.has(r.page)) {
        pageRegionsMap.set(r.page, []);
      }
      pageRegionsMap.get(r.page)!.push({ qIndex, rIndex, region: r });
    });
  });

  // For multi-region pages, verify and resolve any disputed overlapping boundaries
  pageRegionsMap.forEach((regionsOnPage) => {
    if (regionsOnPage.length >= 2) {
      regionsOnPage.sort((a, b) => a.region.bbox.y - b.region.bbox.y);
      for (let i = 0; i < regionsOnPage.length - 1; i++) {
        const top = regionsOnPage[i].region.bbox;
        const bottom = regionsOnPage[i + 1].region.bbox;
        const topMaxY = top.y + top.h;
        if (topMaxY > bottom.y) {
          // Split disputed boundary evenly at midpoint
          const mid = (topMaxY + bottom.y) / 2;
          top.h = Math.max(0.01, mid - top.y);
          bottom.h = Math.max(0.01, (bottom.y + bottom.h) - mid);
          bottom.y = mid;
        }
      }
    }
  });

  const finalOrphans = mergedOrphans.map((o: any) => {
    const bbox = calculateUnionBbox(o.blockIds);
    return {
      id: o.id || Math.random().toString(),
      page: o.page,
      bbox,
      transcribedText: o.transcribedText || "",
      note: o.note || "",
      blockIds: o.blockIds || [],
    };
  });

  const totalScore = finalQuestions.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
  const totalMaxMarks = finalQuestions.reduce((sum: number, q: any) => sum + (q.maxMarks || 0), 0);

  return {
    questions: finalQuestions,
    orphanAnswers: finalOrphans,
    totalScore,
    totalMaxMarks,
    summary: summaries.join("\n\n"),
    ocrBlocks: Object.fromEntries(allBlocksMap),
  };
}
