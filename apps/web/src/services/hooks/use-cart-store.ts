"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { CartItem } from "@/domain/types";
import { cartRepository } from "@/services/mock";
import type { AddCartItemInput } from "@/services/repositories/types";
import { useCartStore as useRawCartStore } from "@/stores/cart";

interface CartState {
  items: CartItem[];
  promoCode?: string;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setPromoCode: (code?: string) => void;
  clear: () => void;
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: cartRepository.get,
    initialData: { items: [], promoCode: undefined },
  });

  const state = useMemo<CartState>(
    () => ({
      items: query.data?.items ?? [],
      promoCode: query.data?.promoCode,
      addItem: (item) => {
        useRawCartStore.getState().addItem(item);
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      updateQuantity: (itemId, quantity) => {
        useRawCartStore.getState().updateQuantity(itemId, quantity);
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      removeItem: (itemId) => {
        useRawCartStore.getState().removeItem(itemId);
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      setPromoCode: (code) => {
        useRawCartStore.getState().setPromoCode(code);
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      clear: () => {
        useRawCartStore.getState().clear();
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
