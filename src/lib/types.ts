// Core domain types shared between client and API routes.

export interface PageImage {
  /** 0-indexed page number */
  page: number;
  /** data URL, e.g. data:image/png;base64,... */
  dataUrl: string;
  width: number;
  height: number;
}

export interface BoundingBox {
  /** all fractions 0-1 relative to the page image */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnswerRegion {
  /** which answer-sheet page (0-indexed) this region is on */
  page: number;
  bbox: BoundingBox;
  
  // Mapping and Segmentation metadata
  rawLabel?: string | null;
  normalizedLabel?: string | null;
  isContinuation?: boolean;
  resolvedQuestionId?: string | null;
  resolutionMethod?: string;
  blockIds?: string[];
  mappingConfidence?: string;
  note?: string;
}

export type QuestionStatus = "answered" | "unanswered" | "partially_answered";

export interface GradedQuestion {
  /** stable id, e.g. "11a" */
  id: string;
  /** printed question number, e.g. "11" */
  number: string;
  /** sub-part label if any, e.g. "a" */
  subpart?: string;
  extractedLabel?: string | null;
  text: string;
  maxMarks: number;
  status: QuestionStatus;
  score: number;
  feedback: string;
  transcribedAnswer: string;
  /** one or more highlighted regions on the answer sheet (can span pages) */
  regions: AnswerRegion[];
}

export interface OrphanAnswer {
  id: string;
  page: number;
  bbox: BoundingBox;
  transcribedText: string;
  note: string;
}

export interface ExtractionResult {
  questions: GradedQuestion[];
  orphanAnswers: OrphanAnswer[];
  totalScore: number;
  totalMaxMarks: number;
  summary: string;
  ocrBlocks?: Record<string, BoundingBox>;
}

export interface ProcessRequestBody {
  questionPaperPages: string[]; // data URLs
  answerSheetPages: string[]; // data URLs
}
