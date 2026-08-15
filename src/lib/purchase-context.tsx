"use client";

import { createContext, useCallback, useContext, useState } from "react";

type PurchaseContextValue = {
  quantity: number | null;
  selectedNumbers: number[];
  setQuantity: (quantity: number) => void;
  setSelectedNumbers: (numbers: number[]) => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [quantity, setQuantityState] = useState<number | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const setQuantity = useCallback((q: number) => {
    setQuantityState(q);
    setSelectedNumbers([]);
  }, []);

  return (
    <PurchaseContext.Provider
      value={{ quantity, selectedNumbers, setQuantity, setSelectedNumbers }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) {
    throw new Error("usePurchase debe usarse dentro de /comprar (PurchaseProvider).");
  }
  return ctx;
}
