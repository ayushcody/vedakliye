"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModelComparisonModalProps {
  onClose: () => void;
  onSelectEngine?: (engine: "gemini" | "mistral") => void;
}

export default function ModelComparisonModal({ onClose, onSelectEngine }: ModelComparisonModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "mistral">("gemini");

  useEffect(() => {
    setMounted(true);
    const current = (localStorage.getItem("ai_engine") as "gemini" | "mistral") || "gemini";
    setSelectedEngine(current);
  }, []);

  const handleChoose = (engine: "gemini" | "mistral") => {
    setSelectedEngine(engine);
    localStorage.setItem("ai_engine", engine);
    if (onSelectEngine) onSelectEngine(engine);
    window.dispatchEvent(new Event("storage"));
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl border border-black/5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8d36] to-[#ff5623] text-white shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#303030]">Model Selection &amp; Comparison</h2>
              <p className="text-xs font-semibold text-[#5e5e5e]/80">Compare AI architectures, benchmarks &amp; choose your active engine</p>
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

        {/* Model Cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          
          {/* Gemini Card */}
          <div
            onClick={() => handleChoose("gemini")}
            className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-200 ${
              selectedEngine === "gemini"
                ? "border-[#ff5623] bg-[#fff8f5] shadow-md ring-2 ring-[#ff5623]/20"
                : "border-black/10 bg-[#f9fafb] hover:border-black/20"
            }`}
          >
            {selectedEngine === "gemini" && (
              <span className="absolute right-3 top-3 rounded-full bg-[#ff5623] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Active
              </span>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                  <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#303030]">Google Gemini</h3>
                  <span className="text-[11px] font-semibold text-[#5e5e5e]">Single-Pass Multimodal</span>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg p-2 border border-emerald-100/80">
                Fast Latency (~1–1.5 mins for sample) · Interactive Grading
              </p>

              {/* Metrics table */}
              <div className="mt-3 flex flex-col gap-2 text-xs text-[#5e5e5e]">
                <div className="flex items-center justify-between border-b border-black/5 pb-1">
                  <span className="font-semibold text-[#303030]">Sample Processing Time</span>
                  <span className="font-bold text-emerald-700">~1 – 1.5 mins</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 pb-1">
                  <span className="font-semibold text-[#303030]">OCR Architecture</span>
                  <span className="font-medium">Direct Vision Embedding</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 pb-1">
                  <span className="font-semibold text-[#303030]">Bounding Boxes</span>
                  <span className="font-medium">Pixel Attention Estimates</span>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="mt-3 space-y-2 text-[11px]">
                <div className="rounded-lg bg-white/80 p-2.5 border border-black/5">
                  <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    Pros:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#5e5e5e]">
                    <li>Instant real-time grading without waiting</li>
                    <li>Handles entire document in single pass</li>
                    <li>Very low API rate limit friction</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-white/80 p-2.5 border border-black/5">
                  <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                    Cons:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#5e5e5e]">
                    <li>Bounding boxes are approximate estimates</li>
                    <li>May blur complex tables or dense calculations</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleChoose("gemini");
              }}
              className={`mt-4 w-full rounded-xl py-2 text-xs font-bold transition-all ${
                selectedEngine === "gemini"
                  ? "bg-[#ff5623] text-white shadow-sm"
                  : "bg-white text-[#303030] border border-black/10 hover:bg-black/5"
              }`}
            >
              {selectedEngine === "gemini" ? "Selected Engine" : "Select Gemini (Fast)"}
            </button>
          </div>

          {/* Mistral Card */}
          <div
            onClick={() => handleChoose("mistral")}
            className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-200 ${
              selectedEngine === "mistral"
                ? "border-[#f66f00] bg-[#fff8f2] shadow-md ring-2 ring-[#f66f00]/20"
                : "border-black/10 bg-[#f9fafb] hover:border-black/20"
            }`}
          >
            {selectedEngine === "mistral" && (
              <span className="absolute right-3 top-3 rounded-full bg-[#f66f00] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Active
              </span>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full bg-[#f66f00] text-white font-black text-sm shadow-sm">
                  M
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#303030]">Mistral AI</h3>
                  <span className="text-[11px] font-semibold text-[#5e5e5e]">OCR 4.1 + Batched Large</span>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-amber-900 bg-amber-50 rounded-lg p-2 border border-amber-200/60">
                High Precision · Dedicated OCR &amp; Strict Bounding Geometry
              </p>

              {/* Metrics table */}
              <div className="mt-3 flex flex-col gap-2 text-xs text-[#5e5e5e]">
                <div className="flex items-center justify-between border-b border-black/5 pb-1">
                  <span className="font-semibold text-[#303030]">Sample Processing Time</span>
                  <span className="font-bold text-amber-900">~3 – 4 mins</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 pb-1">
                  <span className="font-semibold text-[#303030]">OCR Speed</span>
                  <span className="font-medium">~2.3s / page (OCR 4.1)</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 pb-1">
                  <span className="font-semibold text-[#303030]">Bounding Boxes</span>
                  <span className="font-medium">Exact OCR Block Union + Padding</span>
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="mt-3 space-y-2 text-[11px]">
                <div className="rounded-lg bg-white/80 p-2.5 border border-black/5">
                  <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    Pros:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#5e5e5e]">
                    <li>Best-in-class OCR for complex formulas, graphs &amp; tables</li>
                    <li>Bounding boxes strictly exclude blank space &amp; headers</li>
                    <li>Label-based continuation tracking (e.g. Q5_CONT)</li>
                    <li>Automatic subpart deduplication (purges ghost parents)</li>
                  </ul>
                </div>

                <div className="rounded-lg bg-white/80 p-2.5 border border-black/5">
                  <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                    Batch Latency:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#5e5e5e]">
                    <li>Batch 1 (3p): 67.5s · Batch 2 (3p): 80.5s · Batch 3 (2p): 32.7s</li>
                    <li>Runs 3 pages per batch with rate-limit pacing</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleChoose("mistral");
              }}
              className={`mt-4 w-full rounded-xl py-2 text-xs font-bold transition-all ${
                selectedEngine === "mistral"
                  ? "bg-[#f66f00] text-white shadow-sm"
                  : "bg-white text-[#303030] border border-black/10 hover:bg-black/5"
              }`}
            >
              {selectedEngine === "mistral" ? "Selected Engine" : "Select Mistral (Precision)"}
            </button>
          </div>
        </div>

        {/* Pipeline Explainer Box */}
        <div className="mt-5 rounded-2xl border border-black/5 bg-[#f4f6f8] p-4">
          <h4 className="text-xs font-bold text-[#303030] flex items-center gap-2">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#ff5623]/10 text-[#ff5623] text-[10px] font-bold">i</span>
            Mistral Multi-Stage Extraction Pipeline Architecture
          </h4>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-[#5e5e5e]">
            <div className="rounded-xl bg-white p-3 border border-black/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#303030]">1. Dedicated OCR 4.1</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">~2.3s / page</span>
                </div>
                <p className="leading-snug text-[#5e5e5e]">
                  Scans each page image independently, extracting markdown text, LaTeX equations, tables, and bounding block coordinates.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-black/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#303030]">2. Batched LLM Mapping</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">32–80s / batch</span>
                </div>
                <p className="leading-snug text-[#5e5e5e]">
                  Mistral Large processes 3 pages at a time (~8k tokens), matching handwritten question labels (Q1A, Q1B, Q5_CONT), transcribing multi-paragraph answers, and assigning scores.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 border border-black/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#303030]">3. Geometry &amp; Deduplication</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Instant</span>
                </div>
                <p className="leading-snug text-[#5e5e5e]">
                  Merges block geometry with collision-safe padding, resolves boundary disputes evenly, and purges redundant parent ghost questions.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
