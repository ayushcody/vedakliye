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
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#eef5fa] p-4 sm:p-6">
      <div className="relative flex h-full w-full max-w-[1920px] gap-4 overflow-hidden rounded-[32px] bg-[#f4f6f8] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopBar />

          <div className="relative z-10 flex flex-1 items-center justify-center">
            <div className="flex w-full max-w-lg flex-col items-center gap-10">
              
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative flex size-[96px] items-center justify-center">
                  <div className="veda-spin-slow absolute inset-0 rounded-full border-4 border-dashed border-[#ff8d36]/40" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#ffe3d2] to-[#ffcaa8]" />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="relative">
                    <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z" fill="#ff5623" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#303030]">
                    Analyzing Document
                  </h2>
                  <p className="mt-2 text-base font-medium text-[#5e5e5e]/80">
                    Our AI is processing the uploaded files. This typically takes 20-30 seconds.
                  </p>
                </div>
              </div>

              {/* Vertical Stepper */}
              <div className="w-full flex flex-col gap-4">
                {steps.map((step, idx) => {
                  const isActive = idx === stepIndex;
                  const isPast = idx < stepIndex;
                  const isFuture = idx > stepIndex;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`relative flex items-start gap-4 rounded-2xl p-4 transition-all duration-500 ${
                        isActive ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-[#ff8d36]/30 scale-105" 
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
