"use client";

import React, { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { Header } from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import { ModalProvider, useModal } from "../../components/ModalContext";
import { AudioProvider } from "../../components/AudioContext";
import {
  LogoutDialog,
  PolicyDialog,
  CardDetailDialog,
} from "../../components/Modals";

const SeasonLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const pathname = usePathname();
  const season = params.season === "season2" ? "season2" : "season1";
  
  const { logout } = useAuth();
  const {
    showPolicy,
    setShowPolicy,
    showLogout,
    setShowLogout,
    selectedDetailCard,
    setSelectedDetailCard,
  } = useModal();

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Determine current section from pathname
  const currentSection = pathname.includes("/unboxing")
    ? "unboxing"
    : pathname.includes("/lot")
    ? "lot"
    : pathname.includes("/collection")
    ? "collection"
    : pathname.includes("/hall-of-fame")
    ? "hall-of-fame"
    : "opening";

  return (
    <>
      <Header
        currentSeason={season}
        currentSection={currentSection}
        onShowPolicy={() => setShowPolicy(true)}
        onLogoutClick={() => setShowLogout(true)}
      />

      {children}

      {/* --- SHARED MODALS --- */}
      <LogoutDialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={logout}
      />

      <PolicyDialog
        isOpen={showPolicy}
        onClose={() => setShowPolicy(false)}
        appVersion="1.0.1"
      />

      <CardDetailDialog
        isOpen={selectedDetailCard !== null}
        card={selectedDetailCard}
        season={season}
        onClose={() => setSelectedDetailCard(null)}
      />

      {/* --- SCROLL TO TOP --- */}
      {showBackToTop && (
        <button
          id="back-to-top-btn"
          className="back-to-top visible"
          onClick={scrollToTop}
          title="กลับไปด้านบน"
        >
          ↑
        </button>
      )}
    </>
  );
};

export default function SeasonLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <ModalProvider>
        <SeasonLayoutContent>{children}</SeasonLayoutContent>
      </ModalProvider>
    </AudioProvider>
  );
}
