"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AboutModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8d36] to-[#ff5623]">
              <span className="text-xl font-bold text-white">V</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#303030]">Veda AI</h2>
              <p className="text-sm font-semibold text-[#ff5623]">Grader Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#f6f6f6] text-[#5e5e5e] hover:bg-[#e5e5e5] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-[#5e5e5e]">
          <p>
            <strong className="text-[#303030]">Veda AI</strong> is an AI-powered extraction and answer-mapping tool built specifically for teachers grading handwritten exams.
          </p>
          <p>
            Manual grading is incredibly slow, answers are often scattered unpredictably across multiple pages, and verifying student logic takes time. 
          </p>
          <p>
            We built this to automatically scan question papers and student answer sheets, isolate individual responses, and intelligently map them together so you can grade faster and with absolute clarity.
          </p>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
