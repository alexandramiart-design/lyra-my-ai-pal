export type ThemeDef = {
  id: string;
  label: string;
  background: string;
  bubblePrimary: string;
  callGradient: string;
};

export type ThemeId = string;

function mk(
  id: string,
  label: string,
  a: string,
  b: string,
  c: string,
  d: string,
  bubble: string,
): ThemeDef {
  return {
    id,
    label,
    background:
      `radial-gradient(1100px 780px at 12% -5%, ${a} 0%, transparent 58%),` +
      `radial-gradient(900px 700px at 92% 12%, ${b} 0%, transparent 55%),` +
      `radial-gradient(1000px 900px at 50% 108%, ${c} 0%, transparent 62%),` +
      `linear-gradient(160deg, ${b} 0%, ${c} 45%, ${d} 100%)`,
    bubblePrimary: bubble,
    callGradient: `radial-gradient(circle at 50% 28%, ${a}, ${c} 58%, ${d} 100%)`,
  };
}

export const THEME_LIST: ThemeDef[] = [
  mk("neon-cyber", "Neon Cyber", "#22d3ee", "#6366f1", "#7c3aed", "#0b0620", "#6d28d9"),
  mk("holo-magenta", "Holo Magenta", "#f472b6", "#a21caf", "#6d28d9", "#150421", "#a21caf"),
  mk("quantum-blue", "Quantum Blue", "#38bdf8", "#2563eb", "#1e1b4b", "#020617", "#2563eb"),
  mk("plasma-orbit", "Plasma Orbit", "#fb7185", "#e11d48", "#7e22ce", "#1a032a", "#be123c"),
  mk("aurora-x", "Aurora X", "#5eead4", "#22d3ee", "#4338ca", "#04121f", "#0d9488"),
  mk("void-signal", "Void Signal", "#a78bfa", "#4c1d95", "#1e1b4b", "#05020f", "#5b21b6"),
  mk("solar-flux", "Solar Flux", "#fbbf24", "#f97316", "#b91c1c", "#1a0705", "#ea580c"),
  mk("ion-mint", "Ion Mint", "#6ee7b7", "#10b981", "#065f46", "#02120c", "#059669"),
  mk("hyperdrive", "Hyperdrive", "#c084fc", "#7c3aed", "#1d4ed8", "#060420", "#7c3aed"),
  mk("nebula-rose", "Nebula Rose", "#fda4af", "#f43f5e", "#7c3aed", "#170524", "#e11d48"),
  mk("chrome-noir", "Chrome Noir", "#94a3b8", "#334155", "#0f172a", "#010409", "#475569"),
  mk("laser-lime", "Laser Lime", "#bef264", "#65a30d", "#155e75", "#03121a", "#4d7c0f"),
  mk("deep-space", "Deep Space", "#818cf8", "#312e81", "#0f172a", "#000004", "#4338ca"),
  mk("titan-copper", "Titan Copper", "#fdba74", "#c2410c", "#7c2d12", "#160604", "#c2410c"),
  mk("synthwave", "Synthwave", "#f0abfc", "#d946ef", "#1d4ed8", "#0d0326", "#c026d3"),
  mk("arctic-core", "Arctic Core", "#e0f2fe", "#7dd3fc", "#0369a1", "#041b2d", "#0284c7"),
  mk("bio-lumen", "Bio Lumen", "#a3e635", "#14b8a6", "#0f766e", "#02100f", "#0d9488"),
  mk("crimson-grid", "Crimson Grid", "#f87171", "#dc2626", "#450a0a", "#0b0202", "#dc2626"),
  mk("astral-gold", "Astral Gold", "#fde68a", "#d97706", "#4c1d95", "#100617", "#b45309"),
  mk("phantom-teal", "Phantom Teal", "#2dd4bf", "#0891b2", "#164e63", "#020c12", "#0891b2"),
];

export const THEMES: Record<string, ThemeDef> = Object.fromEntries(
  THEME_LIST.map((t) => [t.id, t]),
);

export const DEFAULT_THEME_ID = THEME_LIST[0].id;

export function getTheme(id?: string | null): ThemeDef {
  return (id && THEMES[id]) || THEME_LIST[0];
}
