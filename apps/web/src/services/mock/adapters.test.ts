import { beforeEach, describe, expect, it } from "vitest";
import {
  cartRepository,
  eventRepository,
  orderRepository,
  userRepository,
} from "@/services/mock";
import { useCartStore } from "@/stores/cart";

describe("mock repository adapters", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("exposes the seeded catalog through the event repository", async () => {
    const events = await eventRepository.list();
    const catalog = await eventRepository.catalog();
    const event = await eventRepository.getBySlug("senja-sessions-aurora-live");

    expect(events).toHaveLength(24);
    expect(catalog.categories).toHaveLength(8);
    expect(catalog.venues).toHaveLength(10);
    expect(event?.title).toBe("Senja Sessions: Aurora Live");
  });

  it("maps cart additions and removals through the cart repository", async () => {
    await cartRepository.addItem({
      ownerKey: "local",
      eventId: "evt-01",
      ticketTypeId: "tt-evt-01-regular",
      quantity: 2,
      seatIds: [],
      unitPriceSnapshot: 450_000,
    });

    let cart = await cartRepository.get();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.quantity).toBe(2);

    await cartRepository.updateQuantity(cart.items[0]?.id ?? "", 3);
    cart = await cartRepository.get();
    expect(cart.items[0]?.quantity).toBe(3);

    await cartRepository.removeItem(cart.items[0]?.id ?? "");
    cart = await cartRepository.get();
    expect(cart.items).toHaveLength(0);
  });

  it("exposes the seeded order bundle and demo login", async () => {
    const bundle = await orderRepository.bundle();
    const login = await userRepository.login({
      email: "customer@demo.local",
      password: "demo12345",
    });

    expect(bundle.orders).toHaveLength(11);
    expect(login.ok).toBe(true);
    expect(login.user?.role).toBe("CUSTOMER");
  });
});
