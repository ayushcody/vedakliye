"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");

  useEffect(() => {
    setMounted(true);
    setGeminiKey(localStorage.getItem("gemini_key") || "");
    setMistralKey(localStorage.getItem("mistral_key") || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem("gemini_key", geminiKey);
    localStorage.setItem("mistral_key", mistralKey);
    onClose();
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full max-w-md max-h-[85vh] sm:max-h-[90vh] rounded-[24px] bg-white shadow-xl overflow-hidden">
        <div className="flex items-start justify-between p-6 pb-4 border-b border-black/5 shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#f4f6f8]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#303030]">Settings</h2>
              <p className="text-sm font-semibold text-[#5e5e5e]">API Keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#f6f6f6] text-[#5e5e5e] hover:bg-[#e5e5e5] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030]">Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-[#f4f6f8] px-4 py-3 text-sm font-medium text-[#303030] outline-none focus:border-[#ff5623]/50 focus:ring-2 focus:ring-[#ff5623]/10 transition-all"
            />
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-[#5e5e5e] hover:text-[#ff5623] underline underline-offset-2 w-fit">
              How to get Gemini API key
            </a>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-[#303030]">Mistral API Key</label>
            <input
              type="password"
              placeholder="Enter Mistral key..."
              value={mistralKey}
              onChange={(e) => setMistralKey(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-[#f4f6f8] px-4 py-3 text-sm font-medium text-[#303030] outline-none focus:border-[#ff5623]/50 focus:ring-2 focus:ring-[#ff5623]/10 transition-all"
            />
            <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noreferrer" className="text-xs text-[#5e5e5e] hover:text-[#ff5623] underline underline-offset-2 w-fit">
              How to get Mistral API key
            </a>
          </div>
          
          <button
            onClick={handleSave}
            className="mt-2 w-full rounded-xl bg-[#ff5623] px-4 py-3 text-sm font-bold text-white hover:bg-[#e64a1d] transition-colors cursor-pointer"
          >
            Save Keys
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
