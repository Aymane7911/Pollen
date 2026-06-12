// Expert portrait: shows a real photo when one is provided, otherwise a tasteful
// coloured initials avatar. Presentational (no hooks) — usable anywhere.
export function Avatar({ name, color, photo, size = 76 }: { name: string; color: string; photo?: string; size?: number }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--pa-line)", flexShrink: 0 }}
      />
    );
  }
  const initials = name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.34,
        fontFamily: "'Fraunces', Georgia, serif",
        background: `linear-gradient(140deg, ${color}, ${color}99)`,
        flexShrink: 0,
        boxShadow: "var(--pa-shadow-sm)",
      }}
    >
      {initials}
    </div>
  );
}
