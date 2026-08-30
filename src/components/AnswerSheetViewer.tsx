"use client";

import { useRef, useState, useMemo } from "react";
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
  const [showThumbnails, setShowThumbnails] = useState(true);
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

  // Compute rendering-side outward padding (~0.5% / ~5px) with collision capping between adjacent boxes
  const paddedRegionsOnThisPage = useMemo(() => {
    const rawItems = [
      ...regionsOnThisPage.map((r, i) => ({
        id: `q-${r.questionId}-${i}`,
        type: "question" as const,
        data: r,
        bbox: r.region.bbox,
      })),
      ...orphansOnThisPage.map((o) => ({
        id: `orphan-${o.id}`,
        type: "orphan" as const,
        data: o,
        bbox: o.bbox,
      })),
    ];

    const PAD_FRACTION = 0.005; // ~5px on a 1000px wide image

    const boxes = rawItems.map((item) => ({
      item,
      minX: item.bbox.x,
      minY: item.bbox.y,
      maxX: item.bbox.x + item.bbox.w,
      maxY: item.bbox.y + item.bbox.h,
      padLeft: PAD_FRACTION,
      padRight: PAD_FRACTION,
      padTop: PAD_FRACTION,
      padBottom: PAD_FRACTION,
    }));

    // Cap padding between pairwise adjacent boxes on this page to prevent any overlap
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const b1 = boxes[i];
        const b2 = boxes[j];

        // Check horizontal overlap / proximity
        const horizOverlap =
          Math.min(b1.maxX, b2.maxX) - Math.max(b1.minX, b2.minX) > -0.05;

        if (horizOverlap) {
          if (b1.maxY <= b2.minY) {
            const gap = b2.minY - b1.maxY;
            if (gap < PAD_FRACTION * 2) {
              const maxPad = Math.max(0, gap / 2);
              b1.padBottom = Math.min(b1.padBottom, maxPad);
              b2.padTop = Math.min(b2.padTop, maxPad);
            }
          } else if (b2.maxY <= b1.minY) {
            const gap = b1.minY - b2.maxY;
            if (gap < PAD_FRACTION * 2) {
              const maxPad = Math.max(0, gap / 2);
              b2.padBottom = Math.min(b2.padBottom, maxPad);
              b1.padTop = Math.min(b1.padTop, maxPad);
            }
          }
        }

        // Check vertical overlap / proximity
        const vertOverlap =
          Math.min(b1.maxY, b2.maxY) - Math.max(b1.minY, b2.minY) > -0.05;

        if (vertOverlap) {
          if (b1.maxX <= b2.minX) {
            const gap = b2.minX - b1.maxX;
            if (gap < PAD_FRACTION * 2) {
              const maxPad = Math.max(0, gap / 2);
              b1.padRight = Math.min(b1.padRight, maxPad);
              b2.padLeft = Math.min(b2.padLeft, maxPad);
            }
          } else if (b2.maxX <= b1.minX) {
            const gap = b1.minX - b2.maxX;
            if (gap < PAD_FRACTION * 2) {
              const maxPad = Math.max(0, gap / 2);
              b2.padRight = Math.min(b2.padRight, maxPad);
              b1.padLeft = Math.min(b1.padLeft, maxPad);
            }
          }
        }
      }
    }

    return boxes.map((b) => {
      const paddedMinX = Math.max(0, b.minX - b.padLeft);
      const paddedMinY = Math.max(0, b.minY - b.padTop);
      const paddedMaxX = Math.min(1, b.maxX + b.padRight);
      const paddedMaxY = Math.min(1, b.maxY + b.padBottom);

      return {
        ...b.item,
        paddedBbox: {
          x: paddedMinX,
          y: paddedMinY,
          w: Math.max(0.01, paddedMaxX - paddedMinX),
          h: Math.max(0.01, paddedMaxY - paddedMinY),
        },
      };
    });
  }, [regionsOnThisPage, orphansOnThisPage]);

  if (!currentPage) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-[20px] border border-black/10 bg-white text-[#5e5e5e]">
        No answer sheet pages
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
      <div className="flex flex-wrap sm:flex-nowrap min-h-[56px] shrink-0 items-center justify-between gap-2 border-b border-black/5 bg-white px-3 sm:px-6 py-2 relative z-20">
        <p className="text-base sm:text-lg font-bold text-[#303030]">Answer Sheet</p>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 rounded-xl bg-[#f4f6f8] px-2 sm:px-3 py-1">
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="flex min-w-[44px] min-h-[44px] items-center justify-center text-[#303030] hover:text-black transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-xs sm:text-sm font-bold text-[#303030] min-w-[3ch] text-center">{zoom}%</span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="flex min-w-[44px] min-h-[44px] items-center justify-center text-[#303030] hover:text-black transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 rounded-xl bg-[#f4f6f8] px-2 sm:px-3 py-1">
            <button
              aria-label="Previous page"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              className="flex min-w-[44px] min-h-[44px] items-center justify-center text-[#303030] hover:text-black transition-colors disabled:opacity-30 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-xs sm:text-sm font-bold text-[#303030]">
              Page {pageIndex + 1} of {pages.length}
            </span>
            <button
              aria-label="Next page"
              disabled={pageIndex === pages.length - 1}
              onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
              className="flex min-w-[44px] min-h-[44px] items-center justify-center text-[#303030] hover:text-black transition-colors disabled:opacity-30 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 items-start justify-center overflow-auto bg-[#f4f6f8] p-2 sm:p-6 relative">
        <div
          className="shrink-0 transition-[width] pb-36 min-w-[300px]"
          style={{ width: `${zoom}%`, maxWidth: "900px" }}
        >
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic client-side data URL, not a next/image fit */}
            <img
              src={currentPage.dataUrl}
              alt={`Answer sheet page ${pageIndex + 1}`}
              className="block w-full rounded-2xl border border-black/5 shadow-sm bg-white"
              draggable={false}
            />

            {paddedRegionsOnThisPage
              .filter((item) => item.type === "question")
              .map((item) => {
                const { region, questionId, isSelected } = item.data as {
                  region: any;
                  questionId: string;
                  isSelected: boolean;
                };
                const bbox = item.paddedBbox;

                return (
                  <div
                    key={item.id}
                    className="absolute rounded-2xl transition-all duration-200 overflow-hidden"
                    style={{
                      left: `${bbox.x * 100}%`,
                      top: `${bbox.y * 100}%`,
                      width: `${bbox.w * 100}%`,
                      height: `${bbox.h * 100}%`,
                      backgroundColor: isSelected ? "var(--veda-highlight-bg)" : "rgba(169, 169, 169, 0.05)",
                      borderColor: isSelected ? "var(--veda-highlight-border)" : "rgba(169, 169, 169, 0.6)",
                      borderWidth: isSelected ? "2.5px" : "1.5px",
                      borderStyle: "solid",
                      zIndex: isSelected ? 10 : 1,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 rounded-br-xl px-2.5 py-0.5 text-xs font-bold text-white transition-colors shadow-sm"
                      style={{ backgroundColor: isSelected ? "var(--veda-highlight-tag)" : "rgba(169, 169, 169, 0.8)" }}
                    >
                      Q{questionId}
                    </div>
                  </div>
                );
              })}

            {paddedRegionsOnThisPage
              .filter((item) => item.type === "orphan")
              .map((item) => {
                const orphan = item.data as any;
                const bbox = item.paddedBbox;

                return (
                  <div
                    key={orphan.id}
                    className={`absolute rounded-2xl border-2 border-dashed transition-colors overflow-hidden ${
                      selectedOrphanId === orphan.id
                        ? "border-[#ff5623] bg-[#ff5623]/10"
                        : "border-[#a9a9a9]/60 bg-[#a9a9a9]/5"
                    }`}
                    style={{
                      left: `${bbox.x * 100}%`,
                      top: `${bbox.y * 100}%`,
                      width: `${bbox.w * 100}%`,
                      height: `${bbox.h * 100}%`,
                    }}
                    title={orphan.note}
                  >
                    {selectedOrphanId === orphan.id && (
                      <div className="absolute top-0 left-0 rounded-br-xl bg-[#ff5623] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                        Unmatched
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Thumbnail Slider - Fixed to bottom of card, outside scroll container */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
        <button 
          onClick={() => setShowThumbnails(!showThumbnails)}
          className="pointer-events-auto flex items-center justify-center rounded-t-xl bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)] border border-b-0 border-black/10 px-6 py-1.5 hover:bg-[#f9f9f9] text-[#5e5e5e] transition-colors"
          aria-label={showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-300 ${showThumbnails ? "rotate-180" : ""}`}>
            <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        <div 
          className={`pointer-events-auto w-full overflow-hidden transition-all duration-300 ease-in-out ${
            showThumbnails ? "max-h-[125px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex h-[120px] w-full items-center gap-3 overflow-x-auto bg-white/95 backdrop-blur-md px-6 py-3 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] border-t border-black/5">
            {pages.map((page, idx) => (
              <button
                key={idx}
                onClick={() => setPageIndex(idx)}
                className={`relative h-full shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  pageIndex === idx ? "border-[#ff5623] shadow-md scale-[1.02]" : "border-black/10 hover:border-[#ff5623]/50"
                }`}
              >
                <img src={page.dataUrl} alt={`Thumbnail ${idx + 1}`} className="h-full w-auto object-contain bg-white" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px] font-bold text-white backdrop-blur-sm">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
