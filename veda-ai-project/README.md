# VedaAI — AI Assessment Extraction & Answer Mapping

A teacher uploads a question paper and a student's handwritten answer sheet.
The app extracts every question, extracts the student's answers, maps them
side by side, highlights the exact region of the answer sheet for each
question, and grades the sheet with AI feedback.

## Stack

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS**
- **Google Gemini (`gemini-2.0-flash`)** — multimodal extraction, mapping, and grading in a single structured-output call
- **pdfjs-dist** — client-side PDF → page-image rendering (so both PDFs and plain images work identically)
- No database, no auth — everything lives in React state for the session, per the assignment constraints

## How it works

1. **Upload** — teacher drops in a question paper and an answer sheet (PDF or images).
2. **Client-side conversion** — each file is turned into an array of page images
   (`src/lib/file-to-pages.ts`). PDFs are rendered page-by-page via `pdfjs-dist`
   directly in the browser; images pass through as-is.
3. **Extraction + grading** — the page images are sent to `/api/process`, which
   calls Gemini once with a structured JSON schema (`src/lib/gemini.ts`) asking it to:
   - Extract every question in printed order, splitting labelled sub-parts (11a/11b) into separate entries
   - Locate and transcribe the matching answer, with a bounding box (0-1000 normalized, converted to 0-1 fractions)
   - Handle out-of-order answers, unanswered questions, and orphan handwriting that matches no question
   - Grade each question and produce short AI feedback
4. **Mapping UI** — `MappingScreen` renders the extracted questions on the left
   and the answer sheet on the right; clicking a question highlights its
   answer region(s) with a colored overlay and jumps to the right page.

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your Gemini API key
npm run dev
```

Get a free Gemini API key at https://aistudio.google.com/apikey (generous free tier, supports vision).

## Deploying

This is a standard Next.js app — deploys to Vercel with zero config:

```bash
npm i -g vercel
vercel
```

Set the `GEMINI_API_KEY` environment variable in your Vercel project settings
(Project → Settings → Environment Variables) before deploying, or `vercel env add GEMINI_API_KEY`.

## Assumptions & limitations

- No persistence — refreshing the page loses the current session's results (per the "no database" constraint).
- Grading marks-per-question are inferred by Gemini when not explicitly printed on the question paper (no official answer key is provided as input).
- Bounding-box accuracy depends on Gemini's vision grounding on the specific handwriting/scan quality; very messy handwriting or low-resolution scans may reduce highlight precision.
- A single Gemini call handles the whole pipeline (extraction + mapping + grading) for speed and to keep question/answer context consistent; very long question papers (15+ questions) may approach output-length limits.
