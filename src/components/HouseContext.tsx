"use client";

import React, { createContext, useContext } from "react";
import { useHouse, UseHouseResult } from "../hooks/useHouse";

const HouseContext = createContext<UseHouseResult | undefined>(undefined);

export const HouseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const house = useHouse();

  return (
    <HouseContext.Provider value={house}>{children}</HouseContext.Provider>
  );
};

export const useHouseContext = (): UseHouseResult => {
  const ctx = useContext(HouseContext);
  if (!ctx) {
    throw new Error("useHouseContext must be used within a HouseProvider");
  }
  return ctx;
};