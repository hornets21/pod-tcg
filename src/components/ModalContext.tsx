"use client";

import React, { createContext, useContext, useState } from "react";
import { Card as CardType } from "../data/types";

interface ModalContextType {
  selectedDetailCard: CardType | null;
  setSelectedDetailCard: (card: CardType | null) => void;
  showPolicy: boolean;
  setShowPolicy: (show: boolean) => void;
  showLogout: boolean;
  setShowLogout: (show: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDetailCard, setSelectedDetailCard] = useState<CardType | null>(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        selectedDetailCard,
        setSelectedDetailCard,
        showPolicy,
        setShowPolicy,
        showLogout,
        setShowLogout,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
