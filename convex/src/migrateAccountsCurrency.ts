/**
 * Migration script to add default currency (USD) to existing bank accounts
 * that don't have a currency field set
 */

import { internalMutation } from "./_generated/server";

export const migrateAccountsCurrency = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all bank accounts that don't have currency set
    const accounts = await ctx.db.query("bankAccounts").collect();

    let migratedCount = 0;

    for (const account of accounts) {
      if (!account.currency) {
        await ctx.db.patch(account._id, {
          currency: "USD",
          updatedAt: Date.now(),
        });
        migratedCount++;
      }
    }

    console.log(`Migrated ${migratedCount} accounts to use USD currency`);
    return { migratedCount };
  },
});
