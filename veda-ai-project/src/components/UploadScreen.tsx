"use client";

import { useRef, useState } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

interface UploadScreenProps {
  onStart: (questionPaper: File, answerSheet: File) => void;
}

function UploadSlot({
  label,
  file,
  onFile,
  onClear,
}: {
  label: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (file) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-[20px] border-[1.5px] border-dashed border-[#cecece] bg-white p-2.5">
        <div className="flex items-center gap-3 rounded-xl">
          <div className="flex h-10 w-7 items-center justify-center rounded bg-[#ff5623]/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
                stroke="#ff5623"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="max-w-[180px] truncate text-base font-semibold text-[#303030]">
              {file.name}
            </span>
            <div className="flex items-center gap-1.5 text-sm text-[#5e5e5e]">
              <span>{sizeMb}MB</span>
              <span className="size-1 rounded-full bg-[#5e5e5e]" />
              <span>{file.type === "application/pdf" ? "PDF" : "Image"}</span>
            </div>
          </div>
          <button
            aria-label="Remove file"
            onClick={onClear}
            className="ml-2 flex size-6 items-center justify-center rounded-full bg-[#f0f0f0] text-[#5e5e5e] hover:bg-[#e5e5e5]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex h-full flex-1 items-center justify-center rounded-[20px] border-[1.5px] border-dashed bg-white p-2.5 transition-all duration-200 ${
        dragOver ? "border-[#ff5623] bg-[#fff4ef]" : "border-[#cecece] hover:border-[#ff8d36] hover:bg-[#fff4ef]/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-[#f3f3f3]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14"
              stroke="#5e5e5e"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-xl font-semibold tracking-tight text-[#303030]">
            Upload <span className="text-[#ff5623]">{label}</span>
          </p>
          <p className="text-sm text-[#5e5e5e]/70">Max 10MB</p>
        </div>
      </div>
    </button>
  );
}

export default function UploadScreen({ onStart }: UploadScreenProps) {
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);

  const canStart = !!questionPaper && !!answerSheet;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f5f5f5] to-[#e9e5e5] p-3">
      <div
        className="pointer-events-none absolute h-[428px] w-[1318px] rounded-full opacity-40 blur-3xl"
        style={{ left: "calc(50% + 166px)", top: "calc(50% + 300px)", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, #ffd8c2 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute h-[428px] w-[1113px] rounded-full opacity-40 blur-3xl"
        style={{ left: "calc(50% + 158px)", top: "calc(50% + 500px)", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, #ffd8c2 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex items-start gap-3">
        <Sidebar />
        <div className="flex-1">
          <TopBar />
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="flex w-full max-w-[1103px] flex-col items-center gap-9 rounded-[40px] py-6">
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-[#2b2b2b]">Upload</h1>
              <h1 className="rounded-lg bg-[#ff9350]/15 px-2 py-1 text-4xl font-bold tracking-tight text-[#ff5623]">
                Question Paper &amp; Answer Sheets
              </h1>
            </div>
            <p className="text-xl tracking-tight text-[#303030]">
              Upload both files to get started
            </p>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative flex size-[110px] items-center justify-center rounded-full bg-gradient-to-br from-[#ffe3d2] to-[#ffcaa8]">
                <div className="flex size-[86px] items-center justify-center rounded-full bg-[#ffd9bd]">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21c-3.5 0-6.5-2-6.5-6 0-3 2-4.5 2-7a4.5 4.5 0 0 1 9 0c0 2.5 2 4 2 7 0 4-3 6-6.5 6Z"
                      fill="#ff8d36"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex w-full max-w-[789px] items-stretch gap-4 rounded-3xl bg-white/50 p-3 shadow-sm border border-black/[0.06]">
              <UploadSlot
                label="Question Paper"
                file={questionPaper}
                onFile={setQuestionPaper}
                onClear={() => setQuestionPaper(null)}
              />
              <UploadSlot
                label="Answer Sheet"
                file={answerSheet}
                onFile={setAnswerSheet}
                onClear={() => setAnswerSheet(null)}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              disabled={!canStart}
              onClick={() => canStart && onStart(questionPaper!, answerSheet!)}
              className={`flex items-center gap-2 rounded-full border-2 border-white/15 py-3 pl-6 pr-5 text-sm font-medium text-white transition-all duration-200 ${
                canStart ? "bg-[#303030] opacity-100 hover:bg-[#232323] cursor-pointer" : "bg-[#303030] opacity-25 cursor-not-allowed"
              }`}
            >
              Start Mapping
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-sm text-[#5e5e5e]/80">
              Once both files are uploaded, you&rsquo;ll able to map answers with questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
