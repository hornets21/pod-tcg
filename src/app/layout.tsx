import type { Metadata } from "next";
import { Kanit, Chakra_Petch, Prompt } from "next/font/google";
import "./globals.css";

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
  title: "POD TCG Simulator",
  description: "POD TCG Pack Opening Simulator - A client-side TCG card pack opening simulator with Discord OAuth, rarity systems, and lot management.",
  icons: {
    icon: "/pack_tcg_op_1.ico",
  },
  referrer: "strict-origin-when-cross-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} ${chakraPetch.variable} ${prompt.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
