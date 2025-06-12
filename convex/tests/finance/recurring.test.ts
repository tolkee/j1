import { expect, test, describe, beforeEach } from "vitest";
import {
  createTestInstance,
  createTestUser,
  initializeTestFinanceSetup,
  getUserId,
} from "./test_utils";
import { api } from "../../src/_generated/api";

describe("Finance - Recurring Functions", () => {
  let t: ReturnType<typeof createTestInstance>;
  let userHelper: Awaited<ReturnType<typeof createTestUser>>;
  let setupData: Awaited<ReturnType<typeof initializeTestFinanceSetup>>;

  beforeEach(async () => {
    t = createTestInstance();
    userHelper = await createTestUser(t, "Recurring Test User");
    setupData = await initializeTestFinanceSetup(userHelper, {}, 1000);
  });

  describe("createRecurringTransaction", () => {
    test("should create daily recurring transaction", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          categoryId: setupData.categories[0]._id,
          amount: -50,
          description: "Daily Coffee",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      expect(recurring._id).toBeDefined();
      expect(recurring.userId).toBe(getUserId(userHelper));
      expect(recurring.accountId).toBe(setupData.defaultAccount._id);
      expect(recurring.categoryId).toBe(setupData.categories[0]._id);
      expect(recurring.amount).toBe(-50);
      expect(recurring.description).toBe("Daily Coffee");
      expect(recurring.frequency).toBe("daily");
      expect(recurring.nextExecutionDate).toBe(nextWeek);
      expect(recurring.isActive).toBe(true);
      expect(recurring.createdAt).toBeDefined();
      expect(recurring.updatedAt).toBeDefined();
    });

    test("should create weekly recurring transaction", async () => {
      const nextMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;

      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -200,
          description: "Weekly Groceries",
          frequency: "weekly",
          nextExecutionDate: nextMonth,
        }
      );

      expect(recurring.frequency).toBe("weekly");
      expect(recurring.amount).toBe(-200);
      expect(recurring.description).toBe("Weekly Groceries");
      expect(recurring.categoryId).toBeUndefined();
    });

    test("should create monthly recurring transaction with end date", async () => {
      const nextMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const endDate = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year from now

      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          categoryId: setupData.categories[1]._id,
          amount: 3000,
          description: "Monthly Salary",
          frequency: "monthly",
          nextExecutionDate: nextMonth,
          endDate: endDate,
        }
      );

      expect(recurring.frequency).toBe("monthly");
      expect(recurring.amount).toBe(3000);
      expect(recurring.endDate).toBe(endDate);
    });

    test("should fail with zero amount", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await expect(
        userHelper.mutation(api.finance.recurring.createRecurringTransaction, {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: 0,
          description: "Zero Amount Transaction",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        })
      ).rejects.toThrow("Recurring transaction amount cannot be zero");
    });

    test("should fail with empty description", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await expect(
        userHelper.mutation(api.finance.recurring.createRecurringTransaction, {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "   ",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        })
      ).rejects.toThrow("Recurring transaction description cannot be empty");
    });

    test("should fail with past execution date", async () => {
      const pastDate = Date.now() - 24 * 60 * 60 * 1000; // Yesterday

      await expect(
        userHelper.mutation(api.finance.recurring.createRecurringTransaction, {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "Past Transaction",
          frequency: "daily",
          nextExecutionDate: pastDate,
        })
      ).rejects.toThrow("Next execution date cannot be in the past");
    });

    test("should fail with invalid end date", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const beforeNextWeek = Date.now() + 3 * 24 * 60 * 60 * 1000;

      await expect(
        userHelper.mutation(api.finance.recurring.createRecurringTransaction, {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "Invalid End Date",
          frequency: "daily",
          nextExecutionDate: nextWeek,
          endDate: beforeNextWeek,
        })
      ).rejects.toThrow("End date must be after the first execution date");
    });

    test("should fail with non-existent account", async () => {
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

      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await expect(
        userHelper.mutation(api.finance.recurring.createRecurringTransaction, {
          userId: getUserId(userHelper),
          accountId: await fakeAccountId,
          amount: -50,
          description: "Non-existent Account",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        })
      ).rejects.toThrow("Account not found or access denied");
    });

    test("should fail with account not owned by user", async () => {
      const otherUser = await createTestUser(t, "Other User");
      const otherSetup = await initializeTestFinanceSetup(otherUser);
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await expect(
        userHelper.mutation(api.finance.recurring.createRecurringTransaction, {
          userId: getUserId(userHelper),
          accountId: otherSetup.defaultAccount._id,
          amount: -50,
          description: "Other User Account",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        })
      ).rejects.toThrow("Account not found or access denied");
    });
  });

  describe("getUserRecurringTransactions", () => {
    test("should return empty list for user with no recurring transactions", async () => {
      const recurringTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(recurringTransactions).toHaveLength(0);
    });

    test("should return all recurring transactions for user", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const nextMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;

      // Create multiple recurring transactions
      await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          categoryId: setupData.categories[0]._id,
          amount: -50,
          description: "Daily Coffee",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: 3000,
          description: "Monthly Salary",
          frequency: "monthly",
          nextExecutionDate: nextMonth,
        }
      );

      const recurringTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(recurringTransactions).toHaveLength(2);

      // Verify enriched data
      const coffeeTransaction = recurringTransactions.find(
        (t: any) => t.description === "Daily Coffee"
      );
      expect(coffeeTransaction).toBeDefined();
      expect(coffeeTransaction!.accountName).toBe("Main Account");
      expect(coffeeTransaction!.categoryName).toBeDefined();
      expect(coffeeTransaction!.daysUntilNext).toBeDefined();

      const salaryTransaction = recurringTransactions.find(
        (t: any) => t.description === "Monthly Salary"
      );
      expect(salaryTransaction).toBeDefined();
      expect(salaryTransaction!.accountName).toBe("Main Account");
    });

    test("should filter by account", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Create additional account
      const secondAccount = await userHelper.mutation(
        api.finance.accounts.createAccount,
        {
          userId: getUserId(userHelper),
          name: "Savings Account",
          icon: "💰",
          defaultValue: 0,
          currency: "USD",
        }
      );

      // Create recurring transactions in different accounts
      await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "Main Account Transaction",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: secondAccount._id,
          amount: -100,
          description: "Savings Account Transaction",
          frequency: "weekly",
          nextExecutionDate: nextWeek,
        }
      );

      // Filter by main account
      const mainAccountTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
        }
      );

      expect(mainAccountTransactions).toHaveLength(1);
      expect(mainAccountTransactions[0].description).toBe(
        "Main Account Transaction"
      );

      // Filter by savings account
      const savingsAccountTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
          accountId: secondAccount._id,
        }
      );

      expect(savingsAccountTransactions).toHaveLength(1);
      expect(savingsAccountTransactions[0].description).toBe(
        "Savings Account Transaction"
      );
    });

    test("should filter by active status", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Create recurring transaction
      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "Active Transaction",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      // Deactivate it
      await userHelper.mutation(
        api.finance.recurring.updateRecurringTransaction,
        {
          recurringTransactionId: recurring._id,
          userId: getUserId(userHelper),
          isActive: false,
        }
      );

      // Filter for active only
      const activeTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
          isActive: true,
        }
      );

      expect(activeTransactions).toHaveLength(0);

      // Filter for inactive only
      const inactiveTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
          isActive: false,
        }
      );

      expect(inactiveTransactions).toHaveLength(1);
      expect(inactiveTransactions[0].isActive).toBe(false);
    });
  });

  describe("updateRecurringTransaction", () => {
    test("should update recurring transaction", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Create recurring transaction
      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "Original Description",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      // Add a small delay to ensure updatedAt will be different
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update it
      const updated = await userHelper.mutation(
        api.finance.recurring.updateRecurringTransaction,
        {
          recurringTransactionId: recurring._id,
          userId: getUserId(userHelper),
          amount: -75,
          description: "Updated Description",
          frequency: "weekly",
        }
      );

      expect(updated.amount).toBe(-75);
      expect(updated.description).toBe("Updated Description");
      expect(updated.frequency).toBe("weekly");
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt);
    });

    test("should deactivate recurring transaction", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Create recurring transaction
      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "To Be Deactivated",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      // Deactivate it
      const updated = await userHelper.mutation(
        api.finance.recurring.updateRecurringTransaction,
        {
          recurringTransactionId: recurring._id,
          userId: getUserId(userHelper),
          isActive: false,
        }
      );

      expect(updated.isActive).toBe(false);
    });
  });

  describe("deleteRecurringTransaction", () => {
    test("should delete recurring transaction", async () => {
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Create recurring transaction
      const recurring = await userHelper.mutation(
        api.finance.recurring.createRecurringTransaction,
        {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "To Be Deleted",
          frequency: "daily",
          nextExecutionDate: nextWeek,
        }
      );

      // Delete it
      const result = await userHelper.mutation(
        api.finance.recurring.deleteRecurringTransaction,
        {
          recurringTransactionId: recurring._id,
          userId: getUserId(userHelper),
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("deleted successfully");
      expect(result.deletedTransactionsCount).toBe(0);

      // Verify it's gone
      const remainingTransactions = await userHelper.query(
        api.finance.recurring.getUserRecurringTransactions,
        {
          userId: getUserId(userHelper),
        }
      );

      expect(remainingTransactions).toHaveLength(0);
    });

    test("should fail to delete non-existent recurring transaction", async () => {
      // Create a valid ID that doesn't exist in database
      const fakeId = t.run(async (ctx: any) => {
        const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
        return ctx.db.insert("recurringTransactions", {
          userId: getUserId(userHelper),
          accountId: setupData.defaultAccount._id,
          amount: -50,
          description: "Temp Recurring",
          frequency: "daily",
          nextExecutionDate: nextWeek,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      // Delete it immediately to have a valid but non-existent ID
      await t.run(async (ctx: any) => {
        await ctx.db.delete(await fakeId);
      });

      await expect(
        userHelper.mutation(api.finance.recurring.deleteRecurringTransaction, {
          recurringTransactionId: await fakeId,
          userId: getUserId(userHelper),
        })
      ).rejects.toThrow("Recurring transaction not found or access denied");
    });
  });
});
