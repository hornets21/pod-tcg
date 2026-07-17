export type Rarity = "LEG" | "SEC" | "PASS" | "UR" | "SSR" | "SR" | "R" | "C" | "EVENT";

export interface Card {
  role_id: string;
  name: string;
  rarity: Rarity;
  image: string;
  ability: string;
  isGacha: "Y" | "N";
}
