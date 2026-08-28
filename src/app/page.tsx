"use client";

import { useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import MappingScreen from "@/components/MappingScreen";
import SettingsModal from "@/components/SettingsModal";
import { fileToPages } from "@/lib/file-to-pages";
import type { ExtractionResult, PageImage } from "@/lib/types";

type ViewState = "upload" | "processing" | "mapping" | "error";

export default function Home() {
  const [view, setView] = useState<ViewState>("upload");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [answerSheetPages, setAnswerSheetPages] = useState<PageImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [processingDurationMs, setProcessingDurationMs] = useState<number | null>(null);

  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  async function handleStart(questionPaper: File, answerSheet: File) {
    setView("processing");
    setError(null);
    setProcessingDurationMs(null);
    const startTime = Date.now();

    try {
      setStepIndex(0);
      setProgressMessage("Preparing pages...");
      setProgressPercentage(2);
      const questionPages = await fileToPages(questionPaper);
      setStepIndex(1);
      const answerPages = await fileToPages(answerSheet);
      setAnswerSheetPages(answerPages);
      setStepIndex(2);
      
      const aiEngine = localStorage.getItem("ai_engine") || "gemini";
      const engineName = aiEngine === "mistral" ? "Mistral AI" : "Google Gemini";
      setProgressMessage(`Sending request to ${engineName}...`);

      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: aiEngine,
          questionPaperPages: questionPages.map((p) => p.dataUrl),
          answerSheetPages: answerPages.map((p) => p.dataUrl),
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            if (data.type === "progress") {
              setStepIndex(data.stepIndex);
              setProgressMessage(data.message);
              // Calculate a rough percentage based on step
              setProgressPercentage(Math.min(95, 20 + (data.stepIndex * 20)));
            } else if (data.type === "result") {
              const duration = Date.now() - startTime;
              setProcessingDurationMs(duration);
              setProgressPercentage(100);
              setResult(data.data);
              setView("mapping");
              return; // We're done!
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e) {
            // Ignore parse errors for incomplete JSON (handled by buffer)
            if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
               throw e;
            }
          }
        }
      }

      // If we exit the loop without a result, something went wrong
      if (!result) {
        throw new Error("Stream closed unexpectedly before result was received.");
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setView("error");
    }
  }

  if (view === "upload") {
    return <UploadScreen onStart={handleStart} />;
  }

  if (view === "processing") {
    return <ProcessingScreen stepIndex={stepIndex} />;
  }

  if (view === "error") {
    const isServerLoadError =
      error?.includes("503") ||
      error?.includes("429") ||
      error?.includes("504") ||
      error?.includes("load") ||
      error?.includes("TRANSIENT") ||
      error?.includes("temporarily unavailable") ||
      error?.includes("rate");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#f8f9fa]">
        <div className="w-full max-w-lg rounded-[28px] bg-white p-8 shadow-xl border border-black/5 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/60 mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[#303030]">
            {isServerLoadError ? "Server Under Load" : "Assessment Evaluation Interrupted"}
          </h2>

          <p className="mt-3 text-sm font-medium text-[#5e5e5e] leading-relaxed">
            {isServerLoadError ? (
              <>
                I knew this would happen! dont worry the server is under load.. try again later or just type in your own api key in the{" "}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="font-bold text-[#ff5623] underline underline-offset-4 hover:text-[#d04015] transition-colors inline cursor-pointer"
                >
                  settings
                </button>
                !
              </>
            ) : (
              error || "An unexpected error occurred during processing."
            )}
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => setShowSettings(true)}
              className="w-full rounded-xl bg-[#303030] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-black transition-all"
            >
              Open Settings (Add API Key)
            </button>
            <button
              onClick={() => setView("upload")}
              className="w-full rounded-xl border border-black/10 bg-[#f4f6f8] px-5 py-3 text-xs font-bold text-[#303030] hover:bg-[#eaecee] transition-all"
            >
              Try Again
            </button>
          </div>

          {error && (
            <details className="mt-5 w-full text-left">
              <summary className="text-[11px] font-semibold text-[#8e8e8e] cursor-pointer hover:text-[#303030]">
                Technical Details
              </summary>
              <pre className="mt-2 text-[11px] font-mono bg-[#f4f6f8] p-3 rounded-xl border border-black/5 text-[#5e5e5e] overflow-x-auto whitespace-pre-wrap break-all">
                {error}
              </pre>
            </details>
          )}
        </div>

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    );
  }

  if (view === "mapping" && result) {
    return <MappingScreen result={result} answerSheetPages={answerSheetPages} processingDurationMs={processingDurationMs ?? undefined} />;
  }

  return null;
}
