"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      router.replace(`/season2${search}`);
    }
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "var(--bg-gradient)",
        color: "white",
        fontSize: "1.2rem",
        fontFamily: "var(--font-kanit)",
      }}
    >
      กำลังโหลดข้อมูลจำลอง TCG...
    </div>
  );
}
