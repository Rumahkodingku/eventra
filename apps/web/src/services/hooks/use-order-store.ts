"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { seedData } from "@/data/seed";
import type { Attendee, Order, Ticket } from "@/domain/types";
import { orderRepository } from "@/services/mock";
import type { CreateOrderInput } from "@/services/repositories/types";
import { useOrderStore as useRawOrderStore } from "@/stores/orders";

interface OrderState {
  orders: Order[];
  tickets: Ticket[];
  attendees: Attendee[];
  createOrder: (input: CreateOrderInput) => { order: Order; tickets: Ticket[] };
  checkInTicket: (ticketId: string) => {
    ok: boolean;
    reason?: "not_found" | "already_used" | "invalid";
  };
  reset: () => void;
}

export function useOrderStore<T>(selector: (state: OrderState) => T): T {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["orders"],
    queryFn: orderRepository.bundle,
    initialData: {
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
      createOrder: (input) => {
        const result = useRawOrderStore.getState().createOrder(input);
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["events"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        return result;
      },
      checkInTicket: (ticketId) => {
        const result = useRawOrderStore.getState().checkInTicket(ticketId);
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        return result;
      },
      reset: () => {
        useRawOrderStore.getState().reset();
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      },
    }),
    [query.data, queryClient],
  );

  return selector(state);
}
