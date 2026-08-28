# Veda AI: Automated Assessment Extraction & Answer Mapping

**Veda AI** is an intelligent grading and evaluation platform designed specifically for educators, universities, and examination boards. It automatically ingests handwritten or printed Question Papers and Student Answer Sheets, extracts each question with its subparts, accurately maps handwritten responses across multi-page sheets with pixel-tight bounding boxes, transcribes answers, grades them against expected rubric criteria, and provides detailed pedagogical feedback.

---

## Key Features

- **Dual-Engine Vision Architecture**:
  - **Google Gemini (Flash)**: Lightning-fast multimodal vision evaluation (~1–1.5 mins for full sample papers).
  - **Mistral AI (OCR 4.1 + Batched Mistral Large)**: Enterprise-grade handwriting precision with dedicated OCR extraction and structured bounding geometry (~3–4 mins for sample papers).
- **Two-Pass Extract-then-Verify Pipeline**:
  - **Pass 1**: Multimodal extraction of question hierarchies, transcriptions, scores, rubric feedback, and draft bounding boxes.
  - **Pass 2 (Verification)**: Automatically scans multi-region pages in parallel to verify ink boundaries, resolve disputed line overlaps, and guarantee zero character clipping.
- **Intelligent Parent vs. Subpart Deduplication**:
  - Automatically reconciles question numbering (e.g. `Q1A`, `Q1B`, `Q1C`) and purges redundant parent placeholder entries so total scores and question counts remain exact.
- **Collision-Safe Outward Padding**:
  - Renders a safety margin (~0.5% / ~5px) with pairwise adjacency clipping so handwritten ink strokes (e.g. leading characters or ascenders/descenders) never clip into highlight borders.
- **Full Multi-Paragraph & Multi-Page Continuation Tracking**:
  - Encapsulates entire multi-paragraph answers, bulleted points, diagrams, and formulas across page boundaries (e.g. tracking `Q5_CONT` labels across multiple sheets).
- **Interactive UI Dashboard**:
  - Live stopwatch tracking exact evaluation duration.
  - Interactive split-screen linking questions on the left directly to highlighted bounding boxes on the right.
  - Zoom controls, thumbnail carousel, jump-to-page navigation, and expand/collapse accordions.
  - Client-side settings modal allowing teachers to supply custom API keys on demand.

---

## Pipeline Architecture

```
                               ┌─────────────────────────┐
                               │  Question Paper (PDF)   │
                               │  Answer Sheet (PDF)     │
                               └────────────┬────────────┘
                                            │
                                    (PDF to Image Canvas)
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │            Choose Evaluation Engine           │
                    └───────┬───────────────────────────────┬───────┘
                            │                               │
                [Google Gemini Flash]              [Mistral AI OCR 4.1]
                            │                               │
                            ▼                               ▼
               ┌────────────────────────┐      ┌────────────────────────┐
               │ Direct Vision Embedding│      │ Phase 1: OCR 4.1 Scan  │
               │ Single-Pass Context    │      │ (~2.3s / page)         │
               └────────────┬───────────┘      └────────────┬───────────┘
                            │                               │
                            │                  ┌────────────▼───────────┐
                            │                  │ Phase 2: Batched LLM   │
                            │                  │ (Mistral Large 3p/btch)│
                            │                  └────────────┬───────────┘
                            │                               │
                            ▼                               ▼
               ┌────────────────────────────────────────────────────────┐
               │          Two-Pass Multi-Region Verification            │
               │   • Parallel per-page boundary verification            │
               │   • Disputed overlap resolution                        │
               │   • Full multi-paragraph coverage enforcement          │
               └────────────────────────────┬───────────────────────────┘
                                            │
                                            ▼
               ┌────────────────────────────────────────────────────────┐
               │         Post-Processing & Geometry Synthesis           │
               │   • Question Deduplication (removes ghost parents)     │
               │   • Collision-Safe Outward Padding (~0.5%)             │
               │   • Total Score & Rubric Aggregation                   │
               └────────────────────────────┬───────────────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │ Interactive Results UI  │
                               └─────────────────────────┘
```

---

## Measured Performance Benchmarks

| Metric | Google Gemini (Flash) | Mistral AI (OCR 4.1 + Large) |
| :--- | :--- | :--- |
| **Architecture** | Single-Pass Multimodal Vision | Dedicated OCR 4.1 + Batched LLM |
| **Sample Time (10 Pages)** | **~1 – 1.5 mins** (Fast) | **~3 – 4 mins** (Precision) |
| **OCR Scan Speed** | Integrated vision tokens | **~2.3s / page** |
| **Batch Latency (Mistral)**| N/A | Batch 1 (3p): 67s · Batch 2 (3p): 80s · Batch 3 (2p): 32s |
| **Bounding Box Precision** | Pixel attention coordinates | Exact OCR block union + safety padding |
| **Best Used For** | Real-time interactive grading | Dense formulas, tables & rigorous audit trials |

---

## Project Structure

```
veda/
├── public/
│   └── samples/              # Default sample question paper and answer sheet PDFs
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── process/      # Streaming NDJSON API route with maxDuration=900
│   │   ├── globals.css       # Global styles & design tokens
│   │   ├── layout.tsx        # Root Next.js layout
│   │   └── page.tsx          # Main controller managing upload, processing & result states
│   ├── components/
│   │   ├── AboutModal.tsx            # Application information dialog
│   │   ├── AnswerSheetViewer.tsx     # High-resolution answer viewer with padded SVG overlays
│   │   ├── MappingScreen.tsx         # Split-screen assessment results dashboard
│   │   ├── ModelComparisonModal.tsx  # Architecture comparison & engine selector modal
│   │   ├── ProcessingScreen.tsx      # Multi-step progress animation with live elapsed timer
│   │   ├── QuestionList.tsx          # Collapsible question cards with rubric & AI feedback
│   │   ├── SettingsModal.tsx         # Client-side API key configuration modal
│   │   ├── Sidebar.tsx               # Primary navigation bar
│   │   ├── TopBar.tsx                # Header bar with execution timer badge
│   │   └── UploadScreen.tsx          # Dual PDF dropzone with "Load Sample" button
│   └── lib/
│       ├── gemini.ts         # Google Gemini vision pipeline + Pass 2 verification
│       ├── mistral.ts        # Mistral OCR 4.1 + Batched Mistral Large pipeline
│       ├── pdf.ts            # High-DPI client-side PDF rasterization
│       └── types.ts          # Strongly-typed schema interfaces
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- `npm` or `pnpm`

### 2. Environment Configuration
Create a `.env.local` file in the root directory:

```bash
# Google Gemini API Key
GEMINI_API_KEY="your_gemini_api_key_here"

# Mistral AI API Key
MISTRAL_API_KEY="your_mistral_api_key_here"
```

*(Note: API keys can also be entered directly in the browser via the in-app **Settings** menu).*

### 3. Installation
Install project dependencies:

```bash
npm install
```

### 4. Running Locally
Start the development server:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment

### Build Command
```bash
npm run build
```

### Deploying to Vercel / Cloud Platforms
1. Push your repository to GitHub.
2. Import the project into your hosting provider (e.g. Vercel, Railway, Render).
3. Set the environment variables `GEMINI_API_KEY` and `MISTRAL_API_KEY`.
4. Deploy! The `/api/process` route automatically supports long-running streaming responses with `export const maxDuration = 900;`.
