import { GetThemeValueForKey } from "tamagui";

export interface JarvisService {
  id: string;
  name: string;
  icon: string; // Icon name from @tamagui/lucide-icons
  color: GetThemeValueForKey<"backgroundColor">; // Vivid background color
  route: string; // Navigation route
  enabled: boolean;
}

export interface ServiceNode {
  id: string;
  service: JarvisService;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}
