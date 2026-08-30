"use client";

import type { GradedQuestion } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";

interface QuestionCardProps {
  question: GradedQuestion;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export default function QuestionCard({
  question,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: QuestionCardProps) {
  const badgeStyle =
    question.status === "unanswered"
      ? "bg-[rgba(43,43,43,0.8)]"
      : "bg-[rgba(43,43,43,0.8)]";

  return (
    <div
      id={`question-card-${question.id}`}
      className={`w-full rounded-2xl p-3 transition-all duration-200 ease-in-out ${
        isSelected ? "border-2 border-[#ff8d36] bg-[#ff5623]/[0.04]" : "border-2 border-black/[0.06] bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 sm:gap-4 text-left min-h-[44px]"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className={`flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full text-base sm:text-xl font-extrabold text-white ${
              isSelected ? "bg-[#ff5623]" : badgeStyle
            }`}
          >
            {question.number}
          </div>
          {question.subpart && (
            <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full bg-[#f6f6f6] text-sm sm:text-base font-bold text-[#303030]">
              {question.subpart}.
            </div>
          )}
        </div>
        <p className="flex-1 text-sm sm:text-base leading-relaxed text-[#303030]">{question.text}</p>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <ScoreBadge score={question.score} maxMarks={question.maxMarks} />
          <button
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-lg bg-[#f6f6f6] p-2 hover:bg-[#eaecee] transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#f6f6f6] px-6 py-4">
          {question.status === "unanswered" ? (
            <p className="text-sm text-[#c0350a]">No answer found for this question.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#ff5623]">
                    <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z" fill="currentColor" />
                  </svg>
                  <p className="text-base font-bold text-[#303030]">AI Feedback</p>
                </div>
                <p className="text-sm leading-relaxed text-[#303030]">{question.feedback}</p>
              </div>
              {question.transcribedAnswer && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[#5e5e5e]">Transcribed answer</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#303030]/90 whitespace-pre-wrap">
                    {question.transcribedAnswer}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
