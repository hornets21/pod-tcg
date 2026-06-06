"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import { ModalProvider, useModal } from "../../components/ModalContext";
import {
  LogoutDialog,
  PolicyDialog,
  CardDetailDialog,
} from "../../components/Modals";

const HallOfFameLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <>
      <Header
        currentSeason="season2"
        currentSection="hall-of-fame"
        onShowPolicy={() => setShowPolicy(true)}
        onLogoutClick={() => setShowLogout(true)}
      />

      {children}

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
        season="season2"
        onClose={() => setSelectedDetailCard(null)}
      />

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

export default function HallOfFameLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider>
      <HallOfFameLayoutContent>{children}</HallOfFameLayoutContent>
    </ModalProvider>
  );
}