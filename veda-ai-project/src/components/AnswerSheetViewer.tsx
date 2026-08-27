"use client";

import { useRef, useState } from "react";
import type { PageImage, GradedQuestion, OrphanAnswer } from "@/lib/types";

interface AnswerSheetViewerProps {
  pages: PageImage[];
  allQuestions: GradedQuestion[];
  selectedQuestion: GradedQuestion | null;
  orphanAnswers: OrphanAnswer[];
  selectedOrphanId: string | null;
}

export default function AnswerSheetViewer({
  pages,
  allQuestions,
  selectedQuestion,
  orphanAnswers,
  selectedOrphanId,
}: AnswerSheetViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [pageIndex, setPageIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[pageIndex];

  // Jump to the page containing the first region of the selected question / orphan.
  // Track the previous selection so we only jump when the selection actually changes,
  // and not e.g. because the user manually flipped pages.
  const lastSelectionRef = useRef<string | null>(null);
  const selectionKey = selectedQuestion?.id ?? selectedOrphanId ?? null;
  if (selectionKey !== lastSelectionRef.current) {
    lastSelectionRef.current = selectionKey;
    let targetPage: number | null = null;
    if (selectedQuestion && selectedQuestion.regions.length > 0) {
      targetPage = selectedQuestion.regions[0].page;
    } else if (selectedOrphanId) {
      const orphan = orphanAnswers.find((o) => o.id === selectedOrphanId);
      targetPage = orphan ? orphan.page : null;
    }
    if (targetPage !== null && targetPage !== pageIndex) {
      // Safe: this mirrors the "adjust state during render" pattern React recommends
      // for resetting/deriving state in response to a prop change.
      setPageIndex(targetPage);
    }
  }

  const regionsOnThisPage = allQuestions.flatMap(q => 
    q.regions.filter(r => r.page === pageIndex).map(r => ({
      region: r,
      questionId: q.id,
      isSelected: q.id === selectedQuestion?.id
    }))
  );
  const orphansOnThisPage = orphanAnswers.filter((o) => o.page === pageIndex);

  if (!currentPage) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-[20px] border border-black/10 bg-white text-[#5e5e5e]">
        No answer sheet pages
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 py-3">
        <p className="text-lg font-bold text-[#303030]">Answer Sheet</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#f4f6f8] px-3 py-2">
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="text-[#303030] hover:text-black transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-bold text-[#303030] min-w-[3ch] text-center">{zoom}%</span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="text-[#303030] hover:text-black transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#f4f6f8] px-3 py-2">
            <button
              aria-label="Previous page"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              className="text-[#303030] hover:text-black transition-colors disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-sm font-bold text-[#303030]">
              Page {pageIndex + 1} of {pages.length}
            </span>
            <button
              aria-label="Next page"
              disabled={pageIndex === pages.length - 1}
              onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
              className="text-[#303030] hover:text-black transition-colors disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 items-start justify-center overflow-auto bg-[#f4f6f8] p-6">
        <div
          className="relative shrink-0 transition-[width]"
          style={{ width: `${zoom}%`, maxWidth: "900px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic client-side data URL, not a next/image fit */}
          <img
            src={currentPage.dataUrl}
            alt={`Answer sheet page ${pageIndex + 1}`}
            className="block w-full rounded-2xl border border-black/5 shadow-sm"
            draggable={false}
          />

          {regionsOnThisPage.map(({region, questionId, isSelected}, i) => (
            <div
              key={`${questionId}-${i}`}
              className="absolute rounded-2xl transition-all duration-200"
              style={{
                left: `${region.bbox.x * 100}%`,
                top: `${region.bbox.y * 100}%`,
                width: `${region.bbox.w * 100}%`,
                height: `${region.bbox.h * 100}%`,
                backgroundColor: isSelected ? "var(--veda-highlight-bg)" : "rgba(169, 169, 169, 0.05)",
                borderColor: isSelected ? "var(--veda-highlight-border)" : "rgba(169, 169, 169, 0.6)",
                borderWidth: isSelected ? "2.5px" : "1.5px",
                borderStyle: "solid",
                zIndex: isSelected ? 10 : 1,
              }}
            >
              <div
                className="absolute -top-7 left-3 rounded-t-xl px-3 py-1 text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: isSelected ? "var(--veda-highlight-tag)" : "rgba(169, 169, 169, 0.8)" }}
              >
                Q{questionId}
              </div>
            </div>
          ))}

          {orphansOnThisPage.map((orphan) => (
            <div
              key={orphan.id}
              className={`absolute rounded-2xl border-2 border-dashed transition-colors ${
                selectedOrphanId === orphan.id
                  ? "border-[#ff5623] bg-[#ff5623]/10"
                  : "border-[#a9a9a9]/60 bg-[#a9a9a9]/5"
              }`}
              style={{
                left: `${orphan.bbox.x * 100}%`,
                top: `${orphan.bbox.y * 100}%`,
                width: `${orphan.bbox.w * 100}%`,
                height: `${orphan.bbox.h * 100}%`,
              }}
              title={orphan.note}
            >
              {selectedOrphanId === orphan.id && (
                <div className="absolute -top-7 left-3 rounded-t-xl bg-[#ff5623] px-3 py-1 text-sm font-bold text-white">
                  Unmatched
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
