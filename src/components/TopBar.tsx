"use client";
import { useState, useEffect } from "react";
import AboutModal from "./AboutModal";

export default function TopBar() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [engine, setEngine] = useState("gemini");

  useEffect(() => {
    setEngine(localStorage.getItem("ai_engine") || "gemini");
  }, []);

  return (
    <div className="flex h-14 items-center gap-3 rounded-2xl bg-transparent pl-4 pr-2">

      <div className="flex flex-1 items-center gap-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#a9a9a9]">
            <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
            <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
            <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
            <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="text-base font-semibold text-[#a9a9a9]">Exams</span>
        </div>
        
        <div className="h-4 w-px bg-black/10" />
        
        <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex -space-x-1.5">
            <div className="relative z-10 flex size-4 items-center justify-center rounded-full bg-white ring-1 ring-white">
              <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" className="size-3" />
            </div>
            <div className="relative z-0 flex size-4 items-center justify-center rounded-full bg-[#f66f00] ring-1 ring-white">
              <span className="text-[8px] font-black text-white">M</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wide">
            Powered by Human Intelligence
          </span>
        </div>
      </div>
      <button 
        onClick={() => setIsAboutOpen(true)}
        aria-label="Info"
        className="flex size-9 items-center justify-center rounded-full bg-[#f6f6f6] hover:bg-[#e5e5e5] transition-colors text-[#303030]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      <div className="relative">
        <button
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full hover:bg-[#f6f6f6] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3a5 5 0 0 0-5 5v3.2c0 .6-.24 1.17-.66 1.6L5 14.2c-.83.83-.24 2.24.93 2.24h12.14c1.17 0 1.76-1.41.93-2.24l-1.34-1.4a2.26 2.26 0 0 1-.66-1.6V8a5 5 0 0 0-5-5Z"
              stroke="#303030"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M10 19a2 2 0 0 0 4 0" stroke="#303030" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#ff5623]" />
        </button>

        {isNotificationsOpen && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-black/5 bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-[#303030]">New Notification</span>
              <p className="text-sm font-medium text-[#5e5e5e] leading-snug">
                Send an email to Ayush Chougula (ayushchougula@gmail.com) for selection of next round!
              </p>
            </div>
          </div>
        )}
      </div>


      <div className="relative group">
        <a 
          href="https://ayushchougula.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-[#f0f0f0] transition-colors cursor-pointer"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-[#e5e5e5] text-sm font-semibold text-[#303030]">
            A
          </div>
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-[#303030]">Ayush Chougula</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </a>
        <div className="pointer-events-none absolute -bottom-10 right-0 z-50 whitespace-nowrap rounded-lg bg-[#303030] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          Visit my portfolio
        </div>
      </div>
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
