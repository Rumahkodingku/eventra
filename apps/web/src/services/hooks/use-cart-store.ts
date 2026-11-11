"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { CartItem, CartPricing } from "@/domain/types";
import { quoteCart } from "@/services/api/cart";
import { apiMode, cartRepository } from "@/services/repositories";
import type { AddCartItemInput, CartView } from "@/services/repositories/types";
import { useCartStore as useRawCartStore } from "@/stores/cart";

interface CartState {
  items: CartItem[];
  promoCode?: string;
  isLoading: boolean;
  promoError: string | null;
  quote: CartPricing | null;
  quoteError: string | null;
  addItem: (item: AddCartItemInput) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setPromoCode: (code?: string) => Promise<{ ok: boolean; error?: string }>;
  clear: () => Promise<void>;
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  const queryClient = useQueryClient();
  const [promoError, setPromoError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: cartRepository.get,
    initialData: apiMode ? undefined : { items: [], promoCode: undefined },
  });
  const items = query.data?.items ?? [];
  const promoCode = query.data?.promoCode;
  const eventId = items[0]?.eventId;
  const quoteQuery = useQuery({
    queryKey: [
      "cart-quote",
      eventId,
      promoCode,
      items.map((item) => `${item.id}:${item.quantity}`).join(","),
    ],
    queryFn: () => quoteCart(eventId ?? "", items, promoCode),
    enabled: apiMode && Boolean(eventId) && items.length > 0,
  });

  const state = useMemo<CartState>(
    () => ({
      items: query.data?.items ?? [],
      promoCode: query.data?.promoCode,
      isLoading: query.isLoading,
      promoError,
      quote: quoteQuery.data ?? null,
      quoteError: quoteQuery.error ? "QUOTE_FAILED" : null,
      addItem: async (item) => {
        if (apiMode) {
          const currentEvent = query.data?.items[0]?.eventId;
          try {
            if (currentEvent && currentEvent !== item.eventId) {
              await cartRepository.clear();
            }
            await cartRepository.addItem(item);
          } catch (error) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["availability"] }),
              queryClient.invalidateQueries({ queryKey: ["seats"] }),
              queryClient.invalidateQueries({ queryKey: ["cart"] }),
            ]);
            throw error;
          }
        } else {
          useRawCartStore.getState().addItem(item);
        }
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      updateQuantity: async (itemId, quantity) => {
        if (apiMode) {
          const previous = queryClient.getQueryData<CartView>(["cart"]);
          queryClient.setQueryData<CartView>(["cart"], (current) =>
            current
              ? {
                  ...current,
                  items: current.items.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item,
                  ),
                }
              : current,
          );
          try {
            await cartRepository.updateQuantity(itemId, quantity);
          } catch (error) {
            queryClient.setQueryData(["cart"], previous);
            throw error;
          }
        } else {
          useRawCartStore.getState().updateQuantity(itemId, quantity);
        }
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      removeItem: async (itemId) => {
        if (apiMode) {
          const previous = queryClient.getQueryData<CartView>(["cart"]);
          queryClient.setQueryData<CartView>(["cart"], (current) =>
            current
              ? {
                  ...current,
                  items: current.items.filter((item) => item.id !== itemId),
                }
              : current,
          );
          try {
            await cartRepository.removeItem(itemId);
          } catch (error) {
            queryClient.setQueryData(["cart"], previous);
            throw error;
          }
        } else {
          useRawCartStore.getState().removeItem(itemId);
        }
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
      setPromoCode: async (code) => {
        setPromoError(null);
        try {
          if (apiMode) {
            await cartRepository.setPromoCode(code);
          } else {
            useRawCartStore.getState().setPromoCode(code);
          }
          await queryClient.invalidateQueries({ queryKey: ["cart"] });
          return { ok: true };
        } catch {
          setPromoError("PROMO_INVALID");
          return { ok: false, error: "PROMO_INVALID" };
        }
      },
      clear: async () => {
        if (apiMode) {
          await cartRepository.clear();
        } else {
          useRawCartStore.getState().clear();
        }
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      },
    }),
    [
      query.data,
      query.isLoading,
      promoError,
      queryClient,
      quoteQuery.data,
      quoteQuery.error,
    ],
  );

  return selector(state);
}
