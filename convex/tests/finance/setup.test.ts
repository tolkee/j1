import { expect, test, describe, beforeEach } from "vitest";
import { createTestInstance, createTestUser, getUserId } from "./test_utils";
import { api } from "../../src/_generated/api";

describe("Finance - Setup Functions", () => {
  let t: ReturnType<typeof createTestInstance>;
  let userHelper: Awaited<ReturnType<typeof createTestUser>>;

  beforeEach(async () => {
    t = createTestInstance();
    userHelper = await createTestUser(t, "Setup Test User");
  });

  describe("initializeUserFinance", () => {
    test("should initialize finance system with default settings", async () => {
      const result = await userHelper.mutation(
        api.finance.setup.initializeUserFinance,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("initialized successfully");
      expect(result.defaultAccountId).toBeDefined();
      expect(result.categoriesCreated).toBeGreaterThan(5); // Should create default categories
    });

    test("should initialize with custom account settings", async () => {
      const result = await userHelper.mutation(
        api.finance.setup.initializeUserFinance,
        {
          userId: getUserId(userHelper),
          defaultAccountName: "Custom Main Account",
          defaultAccountIcon: "🏦",
          initialBalance: 5000,
        }
      );

      expect(result.success).toBe(true);
      expect(result.defaultAccountId).toBeDefined();

      // Verify the account was created with custom settings
      const account = await userHelper.query(
        api.finance.accounts.getAccountById,
        {
          accountId: result.defaultAccountId,
          userId: getUserId(userHelper),
        }
      );

      expect(account?.name).toBe("Custom Main Account");
      expect(account?.icon).toBe("🏦");
      expect(account?.currentAmount).toBe(5000);
      expect(account?.isDefault).toBe(true);
    });

    test("should fail if user does not exist", async () => {
      // Create a valid ID that doesn't exist in database
      const fakeUserId = t.run(async (ctx: any) => {
        const currentTime = Date.now();
        return ctx.db.insert("users", {
          name: "Temp User",
          email: "temp@test.com",
          createdAt: currentTime,
          updatedAt: currentTime,
        });
      });

      // Delete it immediately to have a valid but non-existent ID
      await t.run(async (ctx: any) => {
        await ctx.db.delete(await fakeUserId);
      });

      await expect(
        userHelper.mutation(api.finance.setup.initializeUserFinance, {
          userId: await fakeUserId,
        })
      ).rejects.toThrow("User not found");
    });

    test("should fail if finance system already initialized", async () => {
      // Initialize once
      await userHelper.mutation(api.finance.setup.initializeUserFinance, {
        userId: getUserId(userHelper),
      });

      // Try to initialize again
      await expect(
        userHelper.mutation(api.finance.setup.initializeUserFinance, {
          userId: getUserId(userHelper),
        })
      ).rejects.toThrow("User finance system already initialized");
    });

    test("should create default categories", async () => {
      const result = await userHelper.mutation(
        api.finance.setup.initializeUserFinance,
        {
          userId: getUserId(userHelper),
        }
      );

      const categories = await userHelper.query(
        api.finance.categories.getUserCategories,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(categories.length).toBe(result.categoriesCreated);
      expect(categories.length).toBeGreaterThanOrEqual(8); // Expect at least 8 default categories

      // Check for some expected default categories
      const categoryNames = categories.map((cat) => cat.name);
      expect(categoryNames).toContain("Food & Dining");
      expect(categoryNames).toContain("Transportation");
      expect(categoryNames).toContain("Income");
    });
  });

  describe("getFinanceSetupStatus", () => {
    test("should return false for uninitialized user", async () => {
      const status = await userHelper.query(
        api.finance.setup.getFinanceSetupStatus,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(status.isSetup).toBe(false);
      expect(status.hasAccounts).toBe(false);
      expect(status.hasCategories).toBe(false);
      expect(status.hasTransactions).toBe(false);
      expect(status.accountCount).toBe(0);
      expect(status.categoryCount).toBe(0);
      expect(status.transactionCount).toBe(0);
      expect(status.totalBalance).toBe(0);
    });

    test("should return correct status for initialized user", async () => {
      // Initialize finance system
      await userHelper.mutation(api.finance.setup.initializeUserFinance, {
        userId: getUserId(userHelper),
        initialBalance: 1000,
      });

      const status = await userHelper.query(
        api.finance.setup.getFinanceSetupStatus,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(status.isSetup).toBe(true);
      expect(status.hasAccounts).toBe(true);
      expect(status.hasCategories).toBe(true);
      expect(status.hasTransactions).toBe(false); // No transactions yet
      expect(status.accountCount).toBe(1);
      expect(status.categoryCount).toBeGreaterThan(5);
      expect(status.transactionCount).toBe(0);
      expect(status.totalBalance).toBe(1000);
    });

    test("should calculate total balance across multiple accounts", async () => {
      // Initialize finance system
      await userHelper.mutation(api.finance.setup.initializeUserFinance, {
        userId: getUserId(userHelper),
        initialBalance: 500,
      });

      // Create additional account
      await userHelper.mutation(api.finance.accounts.createAccount, {
        userId: getUserId(userHelper),
        name: "Savings Account",
        icon: "💰",
        defaultValue: 1500,
        currency: "USD",
      });

      const status = await userHelper.query(
        api.finance.setup.getFinanceSetupStatus,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(status.accountCount).toBe(2);
      expect(status.totalBalance).toBe(2000); // 500 + 1500
    });
  });

  describe("resetUserFinance", () => {
    test("should fail with wrong confirmation text", async () => {
      await userHelper.mutation(api.finance.setup.initializeUserFinance, {
        userId: getUserId(userHelper),
      });

      await expect(
        userHelper.mutation(api.finance.setup.resetUserFinance, {
          userId: getUserId(userHelper),
          confirmationText: "wrong text",
        })
      ).rejects.toThrow("Invalid confirmation text");
    });

    test("should reset all finance data with correct confirmation", async () => {
      // Initialize finance system
      const initResult = await userHelper.mutation(
        api.finance.setup.initializeUserFinance,
        {
          userId: getUserId(userHelper),
        }
      );

      // Verify data exists
      let status = await userHelper.query(
        api.finance.setup.getFinanceSetupStatus,
        {
          userId: getUserId(userHelper),
        }
      );
      expect(status.isSetup).toBe(true);

      // Reset with correct confirmation
      const resetResult = await userHelper.mutation(
        api.finance.setup.resetUserFinance,
        {
          userId: getUserId(userHelper),
          confirmationText: "DELETE ALL MY FINANCE DATA",
        }
      );

      expect(resetResult.success).toBe(true);
      expect(resetResult.deletedCounts.accounts).toBe(1);
      expect(resetResult.deletedCounts.categories).toBe(
        initResult.categoriesCreated
      );
      expect(resetResult.deletedCounts.transactions).toBe(0);
      expect(resetResult.deletedCounts.recurringTransactions).toBe(0);

      // Verify data is deleted
      status = await userHelper.query(api.finance.setup.getFinanceSetupStatus, {
        userId: getUserId(userHelper),
      });
      expect(status.isSetup).toBe(false);
      expect(status.accountCount).toBe(0);
      expect(status.categoryCount).toBe(0);
    });

    test("should fail to reset for non-existent user", async () => {
      // Create a valid ID that doesn't exist in database
      const fakeUserId = t.run(async (ctx: any) => {
        const currentTime = Date.now();
        return ctx.db.insert("users", {
          name: "Temp User",
          email: "temp@test.com",
          createdAt: currentTime,
          updatedAt: currentTime,
        });
      });

      // Delete it immediately to have a valid but non-existent ID
      await t.run(async (ctx: any) => {
        await ctx.db.delete(await fakeUserId);
      });

      await expect(
        userHelper.mutation(api.finance.setup.resetUserFinance, {
          userId: await fakeUserId,
          confirmationText: "DELETE ALL MY FINANCE DATA",
        })
      ).rejects.toThrow("User not found");
    });
  });

  describe("getFinanceDashboard", () => {
    test("should return dashboard data for initialized user", async () => {
      await userHelper.mutation(api.finance.setup.initializeUserFinance, {
        userId: getUserId(userHelper),
        initialBalance: 2000,
      });

      const dashboard = await userHelper.query(
        api.finance.setup.getFinanceDashboard,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(dashboard.totalBalance).toBe(2000);
      expect(dashboard.accountSummaries).toHaveLength(1);
      expect(dashboard.recentTransactions).toHaveLength(0); // No transactions yet
      expect(dashboard.upcomingRecurring).toHaveLength(0); // No recurring transactions yet
      expect(dashboard.monthlyStats).toBeDefined();
    });
  });
});
