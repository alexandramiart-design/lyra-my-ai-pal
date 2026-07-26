export type ThemeId = "pink" | "lilac" | "ocean" | "forest" | "sunset" | "mono";

export type ThemeDef = {
  id: ThemeId;
  label: string;
  swatch: string[];
  background: string;
  bubblePrimary: string;
  callGradient: string;
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  pink: {
    id: "pink",
    label: "Rose sucré",
    swatch: ["#ff4fa3", "#ff69b4", "#d259e6", "#7b3fe4"],
    background:
      "radial-gradient(1200px 800px at 10% 0%, #ffb3d1 0%, transparent 55%)," +
      "radial-gradient(1000px 700px at 90% 20%, #ff7ab8 0%, transparent 55%)," +
      "radial-gradient(900px 800px at 50% 100%, #b06cf5 0%, transparent 60%)," +
      "linear-gradient(160deg, #ff4fa3 0%, #ff69b4 35%, #d259e6 70%, #7b3fe4 100%)",
    bubblePrimary: "#ec4899",
    callGradient: "radial-gradient(circle at 50% 30%, #ff7ab8, #a63fe4 60%, #4a1a7a 100%)",
  },
  lilac: {
    id: "lilac",
    label: "Lilas nuit",
    swatch: ["#8b5cf6", "#6366f1", "#4f46e5", "#1e1b4b"],
    background:
      "radial-gradient(1000px 700px at 20% 10%, #a78bfa 0%, transparent 55%)," +
      "radial-gradient(900px 700px at 80% 80%, #4338ca 0%, transparent 60%)," +
      "linear-gradient(160deg, #6366f1 0%, #4f46e5 40%, #312e81 100%)",
    bubblePrimary: "#6366f1",
    callGradient: "radial-gradient(circle at 50% 30%, #a78bfa, #4338ca 60%, #1e1b4b 100%)",
  },
  ocean: {
    id: "ocean",
    label: "Océan calme",
    swatch: ["#06b6d4", "#0ea5e9", "#0369a1", "#082f49"],
    background:
      "radial-gradient(1000px 700px at 15% 0%, #67e8f9 0%, transparent 55%)," +
      "radial-gradient(900px 700px at 85% 90%, #0369a1 0%, transparent 60%)," +
      "linear-gradient(160deg, #0ea5e9 0%, #0369a1 55%, #0c4a6e 100%)",
    bubblePrimary: "#0ea5e9",
    callGradient: "radial-gradient(circle at 50% 30%, #67e8f9, #0369a1 60%, #082f49 100%)",
  },
  forest: {
    id: "forest",
    label: "Forêt douce",
    swatch: ["#10b981", "#059669", "#065f46", "#022c22"],
    background:
      "radial-gradient(1000px 700px at 20% 0%, #6ee7b7 0%, transparent 55%)," +
      "radial-gradient(900px 700px at 80% 90%, #065f46 0%, transparent 60%)," +
      "linear-gradient(160deg, #10b981 0%, #047857 55%, #064e3b 100%)",
    bubblePrimary: "#059669",
    callGradient: "radial-gradient(circle at 50% 30%, #6ee7b7, #047857 60%, #022c22 100%)",
  },
  sunset: {
    id: "sunset",
    label: "Coucher de soleil",
    swatch: ["#f97316", "#ef4444", "#b91c1c", "#7c2d12"],
    background:
      "radial-gradient(1000px 700px at 10% 10%, #fdba74 0%, transparent 55%)," +
      "radial-gradient(900px 700px at 90% 80%, #b91c1c 0%, transparent 60%)," +
      "linear-gradient(160deg, #f97316 0%, #ef4444 45%, #7c2d12 100%)",
    bubblePrimary: "#ea580c",
    callGradient: "radial-gradient(circle at 50% 30%, #fdba74, #b91c1c 60%, #7c2d12 100%)",
  },
  mono: {
    id: "mono",
    label: "Nuit graphite",
    swatch: ["#374151", "#1f2937", "#111827", "#030712"],
    background:
      "radial-gradient(1000px 700px at 20% 10%, #4b5563 0%, transparent 55%)," +
      "radial-gradient(900px 700px at 80% 90%, #030712 0%, transparent 60%)," +
      "linear-gradient(160deg, #374151 0%, #1f2937 55%, #030712 100%)",
    bubblePrimary: "#4b5563",
    callGradient: "radial-gradient(circle at 50% 30%, #6b7280, #1f2937 60%, #030712 100%)",
  },
};

export const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna&backgroundType=gradientLinear",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Nova&backgroundType=gradientLinear",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Iris&backgroundType=gradientLinear",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Milo&backgroundType=gradientLinear",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Sacha&backgroundType=gradientLinear",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe&backgroundType=gradientLinear",
];