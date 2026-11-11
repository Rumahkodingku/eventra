"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { seedData } from "@/data/seed";
import {
  apiMode,
  orderRepository,
  organizerRepository,
} from "@/services/repositories";

export function useOrganizerData() {
  const queryClient = useQueryClient();
  const orders = useQuery({
    queryKey: ["organizer-orders"],
    queryFn: organizerRepository.listOrders,
    initialData: apiMode ? undefined : seedData.orders,
  });
  const attendees = useQuery({
    queryKey: ["organizer-attendees"],
    queryFn: organizerRepository.listAttendees,
    initialData: apiMode ? undefined : seedData.attendees,
  });
  const tickets = useQuery({
    queryKey: ["organizer-tickets"],
    queryFn: organizerRepository.listTickets,
    initialData: apiMode ? undefined : seedData.tickets,
  });

  const checkInTicket = async (ticketId: string) => {
    const result = await orderRepository.checkInTicket(ticketId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["organizer-tickets"] }),
      queryClient.invalidateQueries({ queryKey: ["organizer-attendees"] }),
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
    ]);
    return result;
  };

  return {
    orders: orders.data ?? [],
    attendees: attendees.data ?? [],
    tickets: tickets.data ?? [],
    isLoading: orders.isLoading || attendees.isLoading || tickets.isLoading,
    checkInTicket,
  };
}
