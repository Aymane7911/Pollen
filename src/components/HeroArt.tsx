// Decorative hero illustration for the home page: a stylised UAE desert scene (Ghaf
// tree + dunes + sun) with airborne pollen grains drawn in the Atlas palette. Pure SVG,
// no external image — renders crisply at any size and works offline.

function grain(cx: number, cy: number, r: number, color: string, key: string) {
  const spikes = 12;
  const dots = Array.from({ length: spikes }, (_, i) => {
    const a = (i / spikes) * Math.PI * 2;
    return <circle key={i} cx={cx + Math.cos(a) * (r + 4)} cy={cy + Math.sin(a) * (r + 4)} r={2.3} fill={color} />;
  });
  return (
    <g key={key}>
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.14} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r * 0.46} fill={color} opacity={0.28} />
      {dots}
    </g>
  );
}

export function HeroArt() {
  return (
    <svg
      viewBox="0 0 600 440"
      role="img"
      aria-label="Illustration of UAE desert flora with airborne pollen grains"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <linearGradient id="paSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf2ec" />
          <stop offset="100%" stopColor="#fbf8f1" />
        </linearGradient>
        <linearGradient id="paDune1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e7d1" />
          <stop offset="100%" stopColor="#ecdcbd" />
        </linearGradient>
        <linearGradient id="paDune2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d4a8" />
          <stop offset="100%" stopColor="#dcc18a" />
        </linearGradient>
        <radialGradient id="paCanopy" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#2f7a4d" />
          <stop offset="100%" stopColor="#1f5d3a" />
        </radialGradient>
      </defs>

      <rect width="600" height="440" rx="18" fill="url(#paSky)" />

      {/* sun */}
      <circle cx="468" cy="120" r="54" fill="#f6ead2" />
      <circle cx="468" cy="120" r="54" fill="none" stroke="#e6d5ad" strokeWidth="1.5" strokeDasharray="2 8" />

      {/* dunes */}
      <path d="M0 330 Q150 290 300 322 T600 312 V440 H0 Z" fill="url(#paDune1)" />
      <path d="M0 372 Q170 332 340 366 T600 356 V440 H0 Z" fill="url(#paDune2)" />

      {/* Ghaf tree (UAE national tree) */}
      <g>
        <path d="M298 374 C296 342 300 314 304 286" stroke="#8a6a44" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M303 322 C292 314 282 318 276 324 M305 302 C318 294 330 296 338 302" stroke="#8a6a44" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="300" cy="268" rx="76" ry="52" fill="url(#paCanopy)" />
        <ellipse cx="254" cy="282" rx="36" ry="27" fill="#2a6f46" />
        <ellipse cx="348" cy="280" rx="40" ry="30" fill="#256340" />
        <ellipse cx="300" cy="244" rx="46" ry="30" fill="#358055" opacity="0.85" />
      </g>

      {/* airborne pollen grains */}
      <g>
        {grain(118, 150, 26, "#c98a2b", "g1")}
        {grain(210, 84, 17, "#1f5d3a", "g2")}
        {grain(404, 232, 22, "#6c4f9c", "g3")}
        {grain(508, 300, 15, "#c98a2b", "g4")}
        {grain(150, 256, 13, "#2c6e8f", "g5")}
        {grain(430, 96, 12, "#1f5d3a", "g6")}
      </g>
    </svg>
  );
}
