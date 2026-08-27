"use client";

import { useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import MappingScreen from "@/components/MappingScreen";
import { fileToPages } from "@/lib/file-to-pages";
import type { ExtractionResult, PageImage } from "@/lib/types";

type ViewState = "upload" | "processing" | "mapping" | "error";

export default function Home() {
  const [view, setView] = useState<ViewState>("upload");
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [answerSheetPages, setAnswerSheetPages] = useState<PageImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  async function handleStart(questionPaper: File, answerSheet: File) {
    setView("processing");
    setError(null);
    try {
      setStepIndex(0);
      setProgressMessage("Preparing pages...");
      setProgressPercentage(2);
      const questionPages = await fileToPages(questionPaper);
      setStepIndex(1);
      const answerPages = await fileToPages(answerSheet);
      setAnswerSheetPages(answerPages);
      setStepIndex(2);
      setProgressMessage("Initializing AI engine...");
      
      const aiEngine = localStorage.getItem("ai_engine") || "gemini";
      
      // We simulate progress stages while the API call is in flight.
      let currentStep = 2;
      const progressInterval = setInterval(() => {
        currentStep += 1;
        if (currentStep <= 3) {
           setStepIndex(currentStep);
        }
      }, 8000); // advance a step every 8 seconds

      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: aiEngine,
          questionPaperPages: questionPages.map((p) => p.dataUrl),
          answerSheetPages: answerPages.map((p) => p.dataUrl),
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to process files.");
      }

      setProgressPercentage(100);
      const data: ExtractionResult = await res.json();
      setResult(data);
      setView("mapping");
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
    return <ProcessingScreen stepIndex={stepIndex} progressMessage={progressMessage} progressPercentage={progressPercentage} />;
  }

  if (view === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eee] p-8 text-center">
        <p className="text-xl font-bold text-[#c0350a]">Something went wrong</p>
        <p className="max-w-md text-[#5e5e5e]">{error}</p>
        <button
          onClick={() => setView("upload")}
          className="rounded-full bg-[#303030] px-6 py-3 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (view === "mapping" && result) {
    return <MappingScreen result={result} answerSheetPages={answerSheetPages} />;
  }

  return null;
}
