export type Rarity = "LEG" | "SEC" | "UR" | "SSR" | "SR" | "R" | "C";

export interface Card {
  role_id: string;
  name: string;
  rarity: Rarity;
  image: string;
  ability: string;
  isGacha: "Y" | "N";
}
