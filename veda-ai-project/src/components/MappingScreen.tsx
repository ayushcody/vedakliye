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
}

export default function MappingScreen({ result, answerSheetPages }: MappingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    result.questions[0]?.id ?? null
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(result.questions[0] ? [result.questions[0].id] : [])
  );
  const [selectedOrphanId, setSelectedOrphanId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);

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
    <div className="relative flex h-screen w-full gap-3 overflow-hidden bg-gradient-to-b from-[#eee] to-[#dadada] p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <TopBar />

        <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-3 overflow-hidden">
          {/* Left panel: extracted questions */}
          <div className="flex w-[672px] shrink-0 flex-col gap-4 rounded-[20px] bg-white/50 p-4 h-full shadow-sm border border-black/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-[#303030]">
                Extracted Questions (from question paper)
              </p>
              <p className="text-sm text-[#5e5e5e]">
                Score: <span className="font-bold text-[#303030]">{result.totalScore}</span> /{" "}
                {result.totalMaxMarks}
                {unansweredCount > 0 && (
                  <span className="ml-2 text-[#c0350a]">
                    · {unansweredCount} unanswered
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleExpandAll}
              className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#181818]"
            >
              {expandAll ? "Collapse All" : "Expand All"}
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
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
              <div className="mt-2 flex flex-col gap-2">
                <p className="px-1 text-sm font-bold text-[#5e5e5e]">
                  Unmatched handwriting found on the sheet
                </p>
                {result.orphanAnswers.map((o) => (
                  <button
                    key={o.id}
                    onClick={() =>
                      setSelectedOrphanId(selectedOrphanId === o.id ? null : o.id)
                    }
                    className={`rounded-2xl border-2 bg-white p-3 text-left text-sm transition-all duration-200 ${
                      selectedOrphanId === o.id ? "border-[#ff5623]" : "border-transparent hover:border-[#ff8d36]/50"
                    }`}
                  >
                    <p className="font-semibold text-[#303030]">Page {o.page + 1}</p>
                    <p className="text-[#5e5e5e]">{o.note}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border border-black/[0.06] bg-white/60 p-4 text-center shadow-sm">
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
  );
}
