"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Attendee, Order, Ticket } from "@/domain/types";
import {
  apiMode,
  checkoutRepository,
  orderRepository,
} from "@/services/repositories";
import type { CreateOrderInput } from "@/services/repositories/types";
import { useOrderStore as useRawOrderStore } from "@/stores/orders";

interface OrderState {
  orders: Order[];
  tickets: Ticket[];
  attendees: Attendee[];
  isLoading: boolean;
  createOrder: (
    input: CreateOrderInput,
  ) => Promise<{ order: Order; tickets: Ticket[] }>;
  checkInTicket: (ticketId: string) => Promise<{
    ok: boolean;
    reason?: "not_found" | "already_used" | "invalid";
  }>;
  reset: () => void;
}

export function useOrderStore<T>(selector: (state: OrderState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: orderRepository.bundle,
    initialData: apiMode
      ? undefined
      : {
          orders: seedData.orders,
          tickets: seedData.tickets,
          attendees: seedData.attendees,
        },
  });

  const state = useMemo<OrderState>(
    () => ({
      orders: query.data?.orders ?? [],
      tickets: query.data?.tickets ?? [],
      attendees: query.data?.attendees ?? [],
      isLoading: query.isLoading,
      createOrder: async (input) => {
        const result = apiMode
          ? await checkoutRepository.createOrder(input)
          : useRawOrderStore.getState().createOrder(input);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["orders"] }),
          queryClient.invalidateQueries({ queryKey: ["cart"] }),
          queryClient.invalidateQueries({ queryKey: ["events"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        ]);
        return result;
      },
      checkInTicket: async (ticketId) => {
        const result = apiMode
          ? await orderRepository.checkInTicket(ticketId)
          : useRawOrderStore.getState().checkInTicket(ticketId);
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        return result;
      },
      reset: () => {
        useRawOrderStore.getState().reset();
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      },
    }),
    [query.data, query.isLoading, queryClient],
  );

  return selector(state);
}
