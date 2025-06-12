import { JarvisService } from "../types/types";

export const JARVIS_SERVICES: JarvisService[] = [
  {
    id: "finance",
    name: "Finance",
    icon: "DollarSign",
    color: "$green10", // Emerald green for money/finance
    route: "/finance",
    enabled: true,
  },
  {
    id: "nutrition",
    name: "Nutrition & Meals",
    icon: "ChefHat",
    color: "$yellow10", // Yellow for food
    route: "/services/nutrition",
    enabled: true,
  },
  {
    id: "reminders",
    name: "Reminders & Routines",
    icon: "Bell",
    color: "$blue8", // Light blue for reminders
    route: "/services/reminders",
    enabled: true,
  },
  {
    id: "calendar",
    name: "Calendar Intelligence",
    icon: "Calendar",
    color: "$red10", // Red for calendar
    route: "/services/calendar",
    enabled: true,
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    icon: "Brain",
    color: "$blue10", // Blue for knowledge
    route: "/services/knowledge",
    enabled: true,
  },
  {
    id: "health",
    name: "Health & Wellness",
    icon: "Heart",
    color: "$blue8", // Light blue for health
    route: "/services/health",
    enabled: true,
  },
];

export function getEnabledServices(): JarvisService[] {
  return JARVIS_SERVICES.filter((service) => service.enabled);
}

export function getServiceById(id: string): JarvisService | undefined {
  return JARVIS_SERVICES.find((service) => service.id === id);
}
