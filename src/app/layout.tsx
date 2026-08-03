import type { Metadata } from "next";
import { Kanit, Chakra_Petch, Prompt } from "next/font/google";
import "./globals.css";
import { HouseProvider } from "../components/HouseContext";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600"],
  variable: "--font-kanit",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HOGPOD LEGACY TCG",
  description: "HOGPOD LEGACY TCG — A Hogwarts Legacy parody TCG pack opening simulator with Sorting Hat house assignment, rarity systems, and lot management.",
  icons: {
    icon: "/pack_tcg_op_1.ico",
  },
  referrer: "strict-origin-when-cross-origin",
  other: {
    "cache-control": "no-cache, no-store, must-revalidate",
    "pragma": "no-cache",
    "expires": "0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} ${chakraPetch.variable} ${prompt.variable}`}>
      <body>
        <HouseProvider>{children}</HouseProvider>
      </body>
    </html>
  );
}
