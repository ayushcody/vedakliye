"use client";

import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const steps = [
  "Reading question paper",
  "Reading answer sheet",
  "Mapping answers to questions",
  "Grading & generating feedback",
];

export default function ProcessingScreen({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="relative flex h-screen w-full gap-3 overflow-hidden bg-gradient-to-b from-[#eee] to-[#dadada] p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <TopBar />

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative flex size-[128px] items-center justify-center">
            <div className="veda-spin-slow absolute inset-0 rounded-full border-4 border-dashed border-[#ff8d36]/40" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#ffe3d2] to-[#ffcaa8]" />
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" className="relative">
              <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z" fill="#ff5623" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <p
              key={stepIndex}
              className="veda-pulse animate-scale-in text-2xl font-bold tracking-tight text-[#303030]"
            >
              {steps[Math.min(stepIndex, steps.length - 1)]}...
            </p>
            <p className="text-base text-[#5e5e5e]">This may take a while</p>
          </div>
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="h-1.5 w-10 overflow-hidden rounded-full bg-[#e0e0e0]">
                <div
                  className="h-full bg-[#ff5623] transition-all duration-700 ease-in-out"
                  style={{ width: i <= stepIndex ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
