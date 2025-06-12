import { expect, test, describe, beforeEach } from "vitest";
import {
  createTestInstance,
  createTestUser,
  initializeTestFinanceSetup,
  getUserId,
} from "./test_utils";
import { api } from "../../src/_generated/api";

describe("Finance - Balance Functions", () => {
  let t: ReturnType<typeof createTestInstance>;
  let userHelper: Awaited<ReturnType<typeof createTestUser>>;
  let setupData: Awaited<ReturnType<typeof initializeTestFinanceSetup>>;

  beforeEach(async () => {
    t = createTestInstance();
    userHelper = await createTestUser(t, "Balance Test User");
    setupData = await initializeTestFinanceSetup(userHelper, {}, 1000);
  });

  describe("getAccountBalance", () => {
    test("should return current balance for account", async () => {
      const balance = await userHelper.query(
        api.finance.balances.getAccountBalance,
        {
          accountId: setupData.defaultAccount._id,
          userId: getUserId(userHelper),
        }
      );

      expect(balance).toBeDefined();
      expect(balance!.currentAmount).toBe(1000);
      expect(balance!.accountId).toBe(setupData.defaultAccount._id);
      expect(balance!.defaultValue).toBe(1000);
      expect(balance!.transactionCount).toBe(0);
      expect(balance!.lastTransactionDate).toBeUndefined();
      expect(balance!.lastUpdated).toBeDefined();
    });

    test("should return null for non-existent account", async () => {
      // Create a valid ID that doesn't exist in database
      const fakeAccountId = t.run(async (ctx: any) => {
        return ctx.db.insert("bankAccounts", {
          userId: getUserId(userHelper),
          name: "Temp Account",
          icon: "💸",
          currentAmount: 0,
          defaultValue: 0,
          isDefault: false,
          displayOrder: 999,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Delete it immediately to have a valid but non-existent ID
      await t.run(async (ctx: any) => {
        await ctx.db.delete(await fakeAccountId);
      });

      const balance = await userHelper.query(
        api.finance.balances.getAccountBalance,
        {
          accountId: await fakeAccountId,
          userId: await getUserId(userHelper),
        }
      );

      expect(balance).toBeNull();
    });

    test("should return null for account not owned by user", async () => {
      const otherUser = await createTestUser(t, "Other User");
      const otherSetup = await initializeTestFinanceSetup(otherUser);

      const balance = await userHelper.query(
        api.finance.balances.getAccountBalance,
        {
          accountId: otherSetup.defaultAccount._id,
          userId: getUserId(userHelper),
        }
      );

      expect(balance).toBeNull();
    });
  });

  describe("getUserTotalBalance", () => {
    test("should return total balance for single account", async () => {
      const totalBalance = await userHelper.query(
        api.finance.balances.getUserTotalBalance,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(totalBalance.totalBalance).toBe(1000);
      expect(totalBalance.accountCount).toBe(1);
      expect(totalBalance.balanceByAccount).toHaveLength(1);
      expect(totalBalance.balanceByAccount[0].balance).toBe(1000);
      expect(totalBalance.balanceByAccount[0].accountName).toBe("Main Account");
      expect(totalBalance.balanceByAccount[0].isDefault).toBe(true);
      expect(totalBalance.lastUpdated).toBeDefined();
    });

    test("should calculate total balance across multiple accounts", async () => {
      // Create additional accounts
      await userHelper.mutation(api.finance.accounts.createAccount, {
        userId: getUserId(userHelper),
        name: "Savings Account",
        icon: "💰",
        defaultValue: 2500,
        currency: "USD",
      });

      await userHelper.mutation(api.finance.accounts.createAccount, {
        userId: getUserId(userHelper),
        name: "Checking Account",
        icon: "🏦",
        defaultValue: 500,
        currency: "USD",
      });

      const totalBalance = await userHelper.query(
        api.finance.balances.getUserTotalBalance,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(totalBalance.totalBalance).toBe(4000); // 1000 + 2500 + 500
      expect(totalBalance.accountCount).toBe(3);
      expect(totalBalance.balanceByAccount).toHaveLength(3);

      const balances = totalBalance.balanceByAccount.map((acc) => acc.balance);
      expect(balances).toContain(1000);
      expect(balances).toContain(2500);
      expect(balances).toContain(500);
    });

    test("should return empty summary for user with no accounts", async () => {
      const newUser = await createTestUser(t, "No Accounts User");

      const totalBalance = await userHelper.query(
        api.finance.balances.getUserTotalBalance,
        {
          userId: getUserId(newUser),
        }
      );

      expect(totalBalance.totalBalance).toBe(0);
      expect(totalBalance.accountCount).toBe(0);
      expect(totalBalance.balanceByAccount).toHaveLength(0);
    });

    test("should handle includeInactive parameter", async () => {
      const totalBalance = await userHelper.query(
        api.finance.balances.getUserTotalBalance,
        {
          userId: getUserId(userHelper),
          includeInactive: true,
        }
      );

      expect(totalBalance.totalBalance).toBe(1000);
      expect(totalBalance.accountCount).toBe(1);
    });
  });

  describe("getBalanceSummary", () => {
    test("should return balance summary with default period", async () => {
      const summary = await userHelper.query(
        api.finance.balances.getBalanceSummary,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(summary.totalBalance).toBe(1000);
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netFlow).toBe(0);
      expect(summary.accountCount).toBe(1);
      expect(summary.transactionCount).toBe(0);
      expect(summary.averageTransactionAmount).toBe(0);
      expect(summary.periodStart).toBeDefined();
      expect(summary.periodEnd).toBeDefined();
      expect(summary.periodEnd).toBeGreaterThan(summary.periodStart);
    });

    test("should return balance summary with custom period", async () => {
      const summary = await userHelper.query(
        api.finance.balances.getBalanceSummary,
        {
          userId: getUserId(userHelper),
          periodInDays: 7,
        }
      );

      expect(summary.totalBalance).toBe(1000);
      expect(summary.accountCount).toBe(1);
      expect(summary.transactionCount).toBe(0);

      // Verify period duration (7 days in milliseconds)
      const expectedDuration = 7 * 24 * 60 * 60 * 1000;
      const actualDuration = summary.periodEnd - summary.periodStart;
      expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(1000); // Allow 1 second tolerance
    });

    test("should handle multiple accounts in summary", async () => {
      // Create additional account
      await userHelper.mutation(api.finance.accounts.createAccount, {
        userId: getUserId(userHelper),
        name: "Savings Account",
        icon: "💰",
        defaultValue: 1500,
        currency: "USD",
      });

      const summary = await userHelper.query(
        api.finance.balances.getBalanceSummary,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(summary.totalBalance).toBe(2500); // 1000 + 1500
      expect(summary.accountCount).toBe(2);
    });

    test("should return zero values for user with no accounts", async () => {
      const newUser = await createTestUser(t, "No Accounts User");

      const summary = await userHelper.query(
        api.finance.balances.getBalanceSummary,
        {
          userId: getUserId(newUser),
        }
      );

      expect(summary.totalBalance).toBe(0);
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netFlow).toBe(0);
      expect(summary.accountCount).toBe(0);
      expect(summary.transactionCount).toBe(0);
      expect(summary.averageTransactionAmount).toBe(0);
    });
  });
});
