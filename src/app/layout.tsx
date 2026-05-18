import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POD TCG Simulator",
  description: "POD TCG Pack Opening Simulator - A client-side TCG card pack opening simulator with Discord OAuth, rarity systems, and lot management.",
  icons: {
    icon: "https://img.lucky-pod.fun/pack_tcg_op_1.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={kanit.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
