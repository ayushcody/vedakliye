"use client";

import { useMemo, useState } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import QuestionCard from "./QuestionCard";
import AnswerSheetViewer from "./AnswerSheetViewer";
import type { ExtractionResult, PageImage } from "@/lib/types";

interface MappingScreenProps {
  result: ExtractionResult;
  answerSheetPages: PageImage[];
  processingDurationMs?: number;
}

export default function MappingScreen({ result, answerSheetPages, processingDurationMs }: MappingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    result.questions[0]?.id ?? null
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(result.questions[0] ? [result.questions[0].id] : [])
  );
  const [selectedOrphanId, setSelectedOrphanId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const selectedQuestion = useMemo(
    () => result.questions.find((q) => q.id === selectedId) ?? null,
    [result.questions, selectedId]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedIds(new Set());
      setExpandAll(false);
    } else {
      setExpandedIds(new Set(result.questions.map((q) => q.id)));
      setExpandAll(true);
    }
  };

  const unansweredCount = result.questions.filter((q) => q.status === "unanswered").length;

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#eef5fa] p-4 sm:p-6">
      <div className="relative flex h-full w-full max-w-[1920px] gap-4 overflow-hidden rounded-[32px] bg-[#f4f6f8] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopBar processingDurationMs={processingDurationMs} />

          <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-4 overflow-hidden">
          {/* Left panel: extracted questions */}
          <div className="flex w-[672px] shrink-0 flex-col gap-5 rounded-[24px] bg-white p-6 h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-[#303030]">
                Assessment Summary
              </p>
              <button
                onClick={handleExpandAll}
                className="shrink-0 rounded-full bg-[#f4f6f8] px-5 py-2.5 text-sm font-semibold text-[#181818] hover:bg-[#e2e8f0] transition-colors"
              >
                {expandAll ? "Collapse All" : "Expand All"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
                <span className="text-4xl font-bold text-[#303030]">{result.totalScore}/{result.totalMaxMarks}</span>
                <span className="mt-2 text-sm font-semibold text-[#5e5e5e]/80">Total Score</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
                <span className={`text-4xl font-bold ${Math.round((result.totalScore / (result.totalMaxMarks || 1)) * 100) >= 80 ? 'text-[#14b8a6]' : 'text-[#f59e0b]'}`}>
                  {Math.round((result.totalScore / (result.totalMaxMarks || 1)) * 100)}%
                </span>
                <span className="mt-2 text-sm font-semibold text-[#5e5e5e]/80">Accuracy</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
                <span className={`text-4xl font-bold ${unansweredCount > 0 ? "text-[#ef4444]" : "text-[#14b8a6]"}`}>
                  {unansweredCount}
                </span>
                <span className="mt-2 text-sm font-semibold text-[#5e5e5e]/80">Unanswered</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
                <span className="text-4xl font-bold text-[#303030]">{result.questions.length}</span>
                <span className="mt-2 text-sm font-semibold text-[#5e5e5e]/80">Questions Found</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 420px)" }}>
              {result.questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isSelected={selectedId === q.id}
                  isExpanded={expandedIds.has(q.id)}
                  onSelect={() => setSelectedId(q.id)}
                  onToggleExpand={() => toggleExpand(q.id)}
                />
              ))}

              {result.orphanAnswers.length > 0 ? (
                <div className="mt-4 flex flex-col gap-4 rounded-[20px] border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#303030]">Unmatched Handwriting</h3>
                    <button className="rounded-full bg-[#ff5623]/10 px-4 py-1.5 text-xs font-bold text-[#ff5623] hover:bg-[#ff5623]/20 transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {result.orphanAnswers.map((o, idx) => (
                      <div key={o.id} className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedOrphanId(selectedOrphanId === o.id ? null : o.id)}
                          className={`flex items-start justify-between text-left text-sm transition-colors ${
                            selectedOrphanId === o.id ? "text-[#ff5623] font-bold" : "text-[#5e5e5e] hover:text-[#303030]"
                          }`}
                        >
                          <span className="pr-4">{idx + 1}. Page {o.page + 1} &mdash; {o.note}</span>
                          <span className="shrink-0 text-xs font-bold">{Math.round(o.bbox.h * 100)}%</span>
                        </button>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-black/5">
                          <div className="h-full rounded-full bg-[#ff5623]" style={{ width: `${Math.round(o.bbox.h * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2 rounded-[20px] border border-black/[0.06] bg-[#f4f6f8] p-5 text-center shadow-sm">
                  <p className="text-sm font-semibold text-[#5e5e5e]">
                    No unmatched handwriting found — every answer was mapped cleanly.
                  </p>
                </div>
              )}
            </div>
          </div>

        {/* Right panel: answer sheet viewer */}
        <AnswerSheetViewer
          pages={answerSheetPages}
          allQuestions={result.questions}
          selectedQuestion={selectedQuestion}
          orphanAnswers={result.orphanAnswers}
          selectedOrphanId={selectedOrphanId}
        />
      </div>
      </div>
    </div>
  </div>
);
}
