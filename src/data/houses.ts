export type HouseId = "podfindor" | "analyze" | "sraraff" | "wartaurus";

export interface HouseColors {
  accent: string;
  accentGlow: string;
  bgGradient: string;
  tint1: string;
  tint2: string;
}

export interface House {
  id: HouseId;
  name: string;
  motto: string;
  emoji: string;
  mascot: string;
  colors: HouseColors;
}

export const HOUSES: Record<HouseId, House> = {
  podfindor: {
    id: "podfindor",
    name: "Podfindor",
    motto: "ยินดีด้วยคุณกระหน่ำ Boolean cute",
    emoji: "🦁",
    mascot: "/podfindor.webp",
    colors: {
      accent: "#FFB94F",
      accentGlow: "rgba(255, 185, 79, 0.18)",
      bgGradient:
        "linear-gradient(135deg, #1a1305 0%, #2b1d05 50%, #0a0700 100%)",
      tint1: "rgba(255, 185, 79, 0.08)",
      tint2: "rgba(209, 131, 55, 0.06)",
    },
  },
  analyze: {
    id: "analyze",
    name: "Analyze",
    motto: "ยินดีด้วยคุณได้อยู่กับ NVK",
    emoji: "🦅",
    mascot: "/analyze.webp",
    colors: {
      accent: "#9B3DA8",
      accentGlow: "rgba(155, 61, 168, 0.18)",
      bgGradient:
        "linear-gradient(135deg, #14041a 0%, #21082a 50%, #06010a 100%)",
      tint1: "rgba(155, 61, 168, 0.08)",
      tint2: "rgba(96, 26, 93, 0.06)",
    },
  },
  sraraff: {
    id: "sraraff",
    name: "Sraraff",
    motto: "ยินด้วยคุณได้อยู่กับยีราฟ",
    emoji: "🐍",
    mascot: "/sraraff.webp",
    colors: {
      accent: "#A8122C",
      accentGlow: "rgba(168, 18, 44, 0.18)",
      bgGradient:
        "linear-gradient(135deg, #160306 0%, #24070d 50%, #080103 100%)",
      tint1: "rgba(168, 18, 44, 0.08)",
      tint2: "rgba(134, 8, 37, 0.06)",
    },
  },
  wartaurus: {
    id: "wartaurus",
    name: "Wartaurus",
    motto: "ยินดีด้วยคุณได้อยู่กับพี่ว่าน",
    emoji: "🐂",
    mascot: "/wartaurus.webp",
    colors: {
      accent: "#10A34E",
      accentGlow: "rgba(16, 108, 73, 0.18)",
      bgGradient:
        "linear-gradient(135deg, #031208 0%, #072014 50%, #010503 100%)",
      tint1: "rgba(16, 163, 78, 0.08)",
      tint2: "rgba(12, 104, 57, 0.06)",
    },
  },
};

export const HOUSE_IDS: HouseId[] = [
  "podfindor",
  "analyze",
  "sraraff",
  "wartaurus",
];

export const getHouse = (id: HouseId | null): House | null =>
  id ? HOUSES[id] : null;
