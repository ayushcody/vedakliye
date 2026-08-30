"use client";

import { useState, useEffect } from "react";
import AboutModal from "./AboutModal";

interface TopBarProps {
  processingDurationMs?: number;
}

export default function TopBar({ processingDurationMs }: TopBarProps = {}) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="relative flex h-14 w-full items-center justify-between gap-2 rounded-2xl bg-white/75 backdrop-blur-md px-3 sm:px-4 shadow-sm border border-black/5 z-50">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Back Button - Minimum 44x44px touch target */}
        <button 
          aria-label="Go back"
          className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full text-[#303030] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Mobile Title (Phone Spec node 1:10516) */}
        <div className="flex md:hidden items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[#303030] font-['Bricolage_Grotesque',sans-serif]">
            VedaAI
          </span>
        </div>

        {/* Tablet & Desktop Title */}
        <div className="hidden md:flex items-center gap-3">
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
          
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-black/5 bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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

          {processingDurationMs ? (
            <div className="flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-bold text-[#303030] shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff5623" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                Time: <span className="font-mono text-[#ff5623]">{formatDuration(processingDurationMs)}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Info Icon Button (Desktop/Tablet) */}
        <button 
          onClick={() => setIsAboutOpen(true)}
          aria-label="Info"
          className="hidden md:flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-[#f6f6f6] hover:bg-[#e5e5e5] transition-colors text-[#303030] cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </button>

        {/* Notification Bell Button - Min 44x44px touch target */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="Notifications"
            className="relative flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full bg-transparent md:bg-transparent hover:bg-black/5 transition-colors cursor-pointer"
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
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#ff5623]" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-xl border border-black/5 bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-[#303030]">New Notification</span>
                <p className="text-sm font-medium text-[#5e5e5e] leading-snug">
                  Send an email to Ayush Chougula (ayushchougula@gmail.com) for selection of next round!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button - Min 44x44px touch target */}
        <div className="relative group">
          <a 
            href="https://ayushchougula.in" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="User profile"
            className="flex min-w-[44px] min-h-[44px] items-center justify-center md:justify-start gap-2 rounded-xl px-1.5 md:px-3 py-1.5 hover:bg-[#f0f0f0] transition-colors cursor-pointer"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5e5e5] text-sm font-semibold text-[#303030]">
              A
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span className="text-base font-semibold text-[#303030]">Ayush Chougula</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </a>
        </div>

        {/* Mobile Hamburger Menu Icon (Phone Spec node 1:10524) - Min 44x44px touch target */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
          className="flex md:hidden min-w-[44px] min-h-[44px] items-center justify-center rounded-full text-[#303030] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
