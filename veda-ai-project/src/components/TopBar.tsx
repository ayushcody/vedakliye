export default function TopBar() {
  return (
    <div className="flex h-14 items-center gap-2.5 rounded-2xl bg-white/75 pl-6 pr-2 backdrop-blur-sm">
      <button
        aria-label="Back"
        className="flex size-10 items-center justify-center rounded-full bg-white text-[#303030] hover:bg-[#f6f6f6] transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="flex flex-1 items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#a9a9a9]">
          <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="text-base font-semibold text-[#a9a9a9]">Exams</span>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-[#f6f6f6]">
        <span className="flex size-6 items-center justify-center rounded-full border-2 border-[#303030] text-sm font-bold text-[#303030]">
          ?
        </span>
      </div>
      <button
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
      <button
        aria-label="AI"
        className="flex size-9 items-center justify-center rounded-full hover:bg-[#f6f6f6] transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z"
            fill="#303030"
          />
        </svg>
      </button>
      <div className="flex items-center gap-2 rounded-xl px-3 py-1.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#f6f6f6] text-sm font-semibold text-[#303030]">
          A
        </div>
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-[#303030]">Ayush Chougula</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
