"use client";

import { useState, useEffect } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const steps = [
  {
    title: "Reading question paper",
    objective: "Extracting printed questions and assigning max marks."
  },
  {
    title: "Reading answer sheet",
    objective: "Transcribing handwriting and locating answer regions."
  },
  {
    title: "Mapping answers to questions",
    objective: "Intelligently pairing handwritten regions to their respective questions."
  },
  {
    title: "Grading & generating feedback",
    objective: "Evaluating accuracy, assigning scores, and writing constructive feedback."
  }
];

export default function ProcessingScreen({
  stepIndex,
}: {
  stepIndex: number;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex min-h-screen md:h-screen w-full items-center justify-center overflow-y-auto md:overflow-hidden bg-[#eef5fa] p-2 sm:p-4 md:p-6">
      <div className="relative flex min-h-full h-auto md:h-full w-full max-w-[1920px] gap-4 overflow-y-auto md:overflow-hidden rounded-[24px] sm:rounded-[32px] bg-[#f4f6f8] p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopBar />

          <div className="relative z-10 flex flex-1 justify-center overflow-y-auto py-4 sm:py-8">
            <div className="my-auto flex w-full max-w-lg flex-col items-center gap-6 sm:gap-8 pb-8 px-2 sm:px-0">
              
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="relative flex size-[80px] sm:size-[96px] items-center justify-center">
                  <div className="veda-spin-slow absolute inset-0 rounded-full border-4 border-dashed border-[#ff8d36]/40" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#ffe3d2] to-[#ffcaa8]" />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="relative sm:w-8 sm:h-8">
                    <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z" fill="#ff5623" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#303030]">
                    Analyzing Document
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#5e5e5e]/80">
                    Our AI is processing the uploaded files.
                  </p>
                </div>

                {/* Live Processing Timer */}
                <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1.5 text-xs font-bold text-[#303030] shadow-sm">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5623] opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-[#ff5623]"></span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff5623]">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Elapsed Time: <span className="font-mono text-sm">{formatTime(elapsedSeconds)}</span></span>
                </div>
              </div>

              {/* Vertical Stepper */}
              <div className="w-full flex flex-col gap-3 sm:gap-4">
                {steps.map((step, idx) => {
                  const isActive = idx === stepIndex;
                  const isPast = idx < stepIndex;
                  const isFuture = idx > stepIndex;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`relative flex items-start gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 transition-all duration-500 ${
                        isActive ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-[#ff8d36]/30 scale-[1.02] sm:scale-105" 
                        : isPast ? "opacity-70 bg-transparent" 
                        : "opacity-40 bg-transparent grayscale"
                      }`}
                    >
                      {/* Step Indicator */}
                      <div className="relative mt-1 flex size-8 shrink-0 items-center justify-center rounded-full">
                        {isPast ? (
                          <div className="flex size-full items-center justify-center rounded-full bg-[#34c759]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : isActive ? (
                          <>
                            <div className="absolute inset-0 animate-ping rounded-full bg-[#ff5623]/20" />
                            <div className="flex size-full items-center justify-center rounded-full bg-[#ff5623]">
                              <div className="size-2.5 rounded-full bg-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex size-full items-center justify-center rounded-full bg-[#e0e0e0] border border-[#cecece]">
                            <span className="text-xs font-bold text-[#8e8e8e]">{idx + 1}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Step Content */}
                      <div className="flex flex-col">
                        <h3 className={`text-lg font-bold transition-colors ${isActive ? "text-[#ff5623]" : "text-[#303030]"}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm font-medium text-[#5e5e5e] leading-relaxed">
                          {step.objective}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
