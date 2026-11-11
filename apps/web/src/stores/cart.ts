import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/domain/types";
import { createId } from "@/lib/ids";
import { safeStorage } from "@/lib/storage";

interface CartState {
  items: CartItem[];
  promoCode?: string;
  addItem: (item: Omit<CartItem, "id" | "addedAt">) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setPromoCode: (code?: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promoCode: undefined,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (entry) =>
              entry.eventId === item.eventId &&
              entry.ticketTypeId === item.ticketTypeId &&
              entry.seatIds.length === 0 &&
              item.seatIds.length === 0,
          );
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.id === existing.id
                  ? { ...entry, quantity: entry.quantity + item.quantity }
                  : entry,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                id: createId("cart"),
                addedAt: new Date().toISOString(),
              },
            ],
          };
        }),
      updateQuantity: (itemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        })),
      setPromoCode: (promoCode) => set({ promoCode }),
      clear: () => set({ items: [], promoCode: undefined }),
    }),
    {
      name: "eventra-cart",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
