import { apiUserRepository } from "@/services/api/auth";
import {
  apiEventRepository,
  apiOrganizerRepository,
} from "@/services/api/events";
import {
  eventRepository as mockEventRepository,
  organizerRepository as mockOrganizerRepository,
  userRepository as mockUserRepository,
} from "@/services/mock";

export const apiMode = process.env.NEXT_PUBLIC_API_MODE === "api";

export const eventRepository = apiMode
  ? apiEventRepository
  : mockEventRepository;
export const organizerRepository = apiMode
  ? apiOrganizerRepository
  : mockOrganizerRepository;
export const userRepository = apiMode ? apiUserRepository : mockUserRepository;
