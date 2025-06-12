import { ConvexReactClient } from "convex/react";

// For development, you can hardcode the URL or use environment variables
const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ||
  "https://uncommon-magpie-872.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});
