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

export default function Sidebar() {
  return (
    <div className="flex h-full w-16 flex-col items-center justify-between rounded-2xl bg-white px-6 py-3 shadow-[0px_16px_24px_rgba(0,0,0,0.12),0px_32px_24px_rgba(0,0,0,0.2)]">
      <div className="flex flex-col items-center gap-14">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white font-extrabold text-lg">
          V
        </div>
        <div className="flex size-[42px] items-center justify-center rounded-full border-4 border-[#ff7950] bg-[#272727]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2Z" fill="#ff7950" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-2">
          {icons.map((icon) => (
            <div
              key={icon.label}
              title={icon.label}
              className={`flex items-center justify-center rounded-lg p-2 ${
                icon.active ? "bg-[#f0f0f0] text-[#303030]" : "text-[#5e5e5e]/70"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {icon.path}
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-[46px] items-center justify-center rounded-2xl bg-[#f0f0f0] p-0.5">
          <div className="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8d36] to-[#ff5623] text-xs font-bold text-white">
            DPS
          </div>
        </div>
        <button aria-label="Expand sidebar" className="flex items-center justify-center p-2 text-[#5e5e5e]/70">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 6l6 6-6 6M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
