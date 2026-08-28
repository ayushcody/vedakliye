const icons = [
  {
    label: "Home",
    path: (
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "My Classroom",
    path: (
      <path
        d="M3 6h13l5 4v8H3V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Assignments",
    path: (
      <path
        d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Exams",
    active: true,
    path: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 9h6M9 13h6M9 17h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "My Library",
    path: (
      <path
        d="M12 21c-2-2-6-3-9-2V6c3-1 7 0 9 2 2-2 6-3 9-2v13c-3-1-7 0-9 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
];

import { useEffect, useState } from "react";
import SettingsModal from "./SettingsModal";
import ModelComparisonModal from "./ModelComparisonModal";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState("Exams");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [aiEngine, setAiEngine] = useState<"gemini" | "mistral">("gemini");

  useEffect(() => {
    const updateEngine = () => {
      setAiEngine((localStorage.getItem("ai_engine") as "gemini" | "mistral") || "gemini");
    };
    updateEngine();
    window.addEventListener("storage", updateEngine);
    return () => window.removeEventListener("storage", updateEngine);
  }, []);

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col justify-between rounded-[24px] bg-white px-6 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] shadow-sm overflow-hidden border border-black/5">
            <img src="/logo.png" alt="VedaAI Logo" className="size-full object-cover" />
          </div>
          <span className="text-xl font-extrabold text-[#303030]">VedaAI</span>
        </div>
        
        <button 
          onClick={() => alert("AI Teacher's Toolkit is under construction!")}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#ff5623]/30 bg-[#2b2b2b] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z" fill="#ff7950" />
          </svg>
          AI Teacher's Toolkit
        </button>

        <div className="flex flex-col gap-1 mt-2">
          {icons.map((icon) => (
            <button
              key={icon.label}
              title={icon.label}
              onClick={() => setActiveTab(icon.label)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                activeTab === icon.label ? "bg-[#f4f6f8] text-[#303030]" : "text-[#5e5e5e]/70 hover:bg-[#f4f6f8]/50 hover:text-[#303030]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {icon.path}
              </svg>
              <span>{icon.label}</span>
            </button>
          ))}

          {/* Model Selection Option */}
          <button
            onClick={() => setIsModelModalOpen(true)}
            title="Model Selection & Comparison"
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-semibold text-[#5e5e5e]/70 hover:bg-[#f4f6f8]/50 hover:text-[#303030] transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Model Selection</span>
            </div>
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
              aiEngine === "gemini" 
                ? "bg-[#ff5623]/10 text-[#ff5623]" 
                : "bg-[#f66f00]/10 text-[#f66f00]"
            }`}>
              {aiEngine === "gemini" ? "Gemini" : "Mistral"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Settings" 
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[#5e5e5e]/70 hover:bg-[#f4f6f8]/50 hover:text-[#303030] transition-all duration-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </button>

        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-black/5 bg-[#f4f6f8] p-3">
          <div className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-white p-0.5 shadow-sm">
            <div className="flex size-full items-center justify-center rounded-lg bg-gradient-to-br from-[#ff8d36] to-[#ff5623] text-[10px] text-center font-black text-white leading-tight">
              CSE
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#303030]">Computer Science & Eng.</span>
            <span className="text-xs font-medium text-[#5e5e5e]/70">Semester 8 · Final Year</span>
          </div>
        </div>
      </div>
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      {isModelModalOpen && (
        <ModelComparisonModal
          onClose={() => setIsModelModalOpen(false)}
          onSelectEngine={(engine) => setAiEngine(engine)}
        />
      )}
    </div>
  );
}
