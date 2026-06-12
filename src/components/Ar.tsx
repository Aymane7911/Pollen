import type { CSSProperties } from "react";

// Renders Arabic text right-to-left with an Arabic-capable font. Returns null when empty,
// so it can be dropped next to any optional Arabic name field without extra guards.
export function Ar({ text, className = "", style }: { text?: string | null; className?: string; style?: CSSProperties }) {
  if (!text) return null;
  return (
    <span dir="rtl" lang="ar" className={`pa-ar ${className}`.trim()} style={style}>
      {text}
    </span>
  );
}
