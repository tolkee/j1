import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get personalized welcome message for a user
 */
export const getWelcomeMessage = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    message: v.string(),
    isPersonalized: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get user information
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        message: "Welcome to Jarvis!",
        isPersonalized: false,
      };
    }

    // Get welcome message configuration
    const welcomeConfig = await ctx.db
      .query("welcomeMessages")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();

    // If user has a custom message and it's active, use it
    if (welcomeConfig?.customMessage && welcomeConfig.isActive) {
      return {
        message: welcomeConfig.customMessage,
        isPersonalized: true,
      };
    }

    // Generate personalized message based on user preferences
    const displayName = user.preferredName || user.name;
    const timeOfDay = getTimeOfDay(user.timezone);

    let personalizedMessage = `Good ${timeOfDay}, ${displayName}! Welcome to Jarvis.`;

    // Add preference-based customization
    if (user.welcomeMessagePreference === "formal") {
      personalizedMessage = `Good ${timeOfDay}, ${user.name}. Welcome to your Jarvis assistant.`;
    } else if (user.welcomeMessagePreference === "casual") {
      personalizedMessage = `Hey ${displayName}! Ready to get things done with Jarvis?`;
    } else if (user.welcomeMessagePreference === "motivational") {
      personalizedMessage = `${timeOfDay} ${displayName}! Let's make today productive with Jarvis!`;
    }

    return {
      message: personalizedMessage,
      isPersonalized: true,
    };
  },
});

/**
 * Update welcome message preferences for a user
 */
export const updateWelcomeMessagePreference = mutation({
  args: {
    userId: v.id("users"),
    preference: v.union(
      v.literal("personalized"),
      v.literal("formal"),
      v.literal("casual"),
      v.literal("motivational"),
      v.literal("custom")
    ),
    customMessage: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Update user's welcome message preference
    await ctx.db.patch(args.userId, {
      welcomeMessagePreference: args.preference,
    });

    // Get or create welcome message configuration
    let welcomeConfig = await ctx.db
      .query("welcomeMessages")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();

    if (!welcomeConfig) {
      // Create new welcome message configuration
      await ctx.db.insert("welcomeMessages", {
        userId: args.userId,
        customMessage: args.customMessage,
        isActive: true,
      });
    } else {
      // Update existing configuration
      const updates: any = {
        isActive: true,
      };

      if (args.preference === "custom" && args.customMessage) {
        updates.customMessage = args.customMessage;
      }

      await ctx.db.patch(welcomeConfig._id, updates);
    }

    return {
      success: true,
      message: "Welcome message preference updated successfully",
    };
  },
});

/**
 * Set custom welcome message for a user
 */
export const setCustomWelcomeMessage = mutation({
  args: {
    userId: v.id("users"),
    customMessage: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Update user preference to custom
    await ctx.db.patch(args.userId, {
      welcomeMessagePreference: "custom",
    });

    // Get or create welcome message configuration
    let welcomeConfig = await ctx.db
      .query("welcomeMessages")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();

    if (!welcomeConfig) {
      // Create new welcome message configuration
      await ctx.db.insert("welcomeMessages", {
        userId: args.userId,
        customMessage: args.customMessage,
        isActive: true,
      });
    } else {
      // Update existing configuration
      await ctx.db.patch(welcomeConfig._id, {
        customMessage: args.customMessage,
        isActive: true,
      });
    }

    return {
      success: true,
      message: "Custom welcome message set successfully",
    };
  },
});

/**
 * Helper function to determine time of day based on timezone
 */
function getTimeOfDay(timezone?: string): string {
  const now = new Date();

  // If timezone is provided, try to use it
  if (timezone) {
    try {
      const timeInZone = new Date(
        now.toLocaleString("en-US", { timeZone: timezone })
      );
      const hour = timeInZone.getHours();

      if (hour < 12) return "morning";
      if (hour < 17) return "afternoon";
      return "evening";
    } catch (error) {
      // Fall back to UTC if timezone is invalid
    }
  }

  // Default to UTC
  const hour = now.getUTCHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
