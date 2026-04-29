"use client";

const NODES = [
  { t: 12, l: 8, s: 8, d: 0 },
  { t: 22, l: 28, s: 6, d: 1.2 },
  { t: 38, l: 15, s: 10, d: 0.4 },
  { t: 18, l: 55, s: 7, d: 2.1 },
  { t: 55, l: 40, s: 9, d: 0.8 },
  { t: 48, l: 65, s: 5, d: 1.5 },
  { t: 70, l: 20, s: 6, d: 0.2 },
  { t: 65, l: 75, s: 8, d: 1.0 }
];

export function ConstellationPanel() {
  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden bg-[linear-gradient(180deg,#f8f9fb_0%,#eef2ff_100%)] md:min-h-0">
      <svg className="absolute inset-0 h-full w-full opacity-55" aria-hidden>
        <line x1="12%" y1="12%" x2="28%" y2="22%" stroke="var(--accent-secondary)" strokeWidth="0.5" />
        <line x1="28%" y1="22%" x2="15%" y2="38%" stroke="var(--accent-secondary)" strokeWidth="0.5" />
        <line x1="55%" y1="18%" x2="40%" y2="55%" stroke="var(--accent-primary)" strokeWidth="0.5" />
        <line x1="40%" y1="55%" x2="65%" y2="48%" stroke="var(--accent-secondary)" strokeWidth="0.5" />
        <line x1="20%" y1="70%" x2="75%" y2="65%" stroke="var(--accent-primary)" strokeWidth="0.5" />
      </svg>
      {NODES.map((n, i) => (
        <div
          key={i}
          className="nc-star absolute rounded-full bg-[var(--accent-secondary)] shadow-[var(--glow-blue)]"
          style={{
            top: `${n.t}%`,
            left: `${n.l}%`,
            width: n.s,
            height: n.s,
            animationDelay: `${n.d}s`
          }}
        />
      ))}
      <p className="absolute bottom-8 left-8 max-w-xs font-[family-name:var(--font-fraunces)] text-sm italic text-[var(--text-muted)]">
        Map your academic journey. Goals are destinations; free time is open road.
      </p>
    </div>
  );
}
