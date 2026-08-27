export default function ScoreBadge({ score, maxMarks }: { score: number; maxMarks: number }) {
  const ratio = maxMarks > 0 ? score / maxMarks : 0;

  let bg = "var(--veda-success-bg)";
  let color = "var(--veda-success)";
  if (ratio <= 0) {
    bg = "var(--veda-error-bg)";
    color = "var(--veda-error)";
  } else if (ratio < 1) {
    bg = "var(--veda-warning-bg)";
    color = "var(--veda-warning)";
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full px-3 py-1 text-base font-bold animate-scale-in"
      style={{ backgroundColor: bg, color }}
    >
      {score} / {maxMarks}
    </div>
  );
}
