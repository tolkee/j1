import { expect, test, describe } from "vitest";
import { api } from "../../src/_generated/api";
import { Id } from "../../src/_generated/dataModel";
import {
  createTestInstance,
  createTestUser,
  createTestAccount,
  createTestTransaction,
  assertApproximatelyEqual,
  getUserId,
} from "./test_utils";

describe("Account Management", () => {
  describe("Account Creation", () => {
    test("should create account with default settings", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");

      const account = await user.mutation(api.finance.accounts.createAccount, {
        userId: getUserId(user),
        name: "Main Checking",
        description: "Primary account",
        icon: "💳",
        defaultValue: 1000,
        currency: "USD",
      });

      expect(account).toMatchObject({
        name: "Main Checking",
        description: "Primary account",
        icon: "💳",
        currentAmount: 1000,
        defaultValue: 1000,
        isDefault: true, // First account should be default
        displayOrder: 0,
      });
      expect(account._id).toBeDefined();
      expect(account.createdAt).toBeDefined();
      expect(account.updatedAt).toBeDefined();
    });

    test("should create multiple accounts with correct default logic", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // First account should be default
      const account1 = await user.mutation(api.finance.accounts.createAccount, {
        userId,
        name: "Main Account",
        icon: "💳",
        defaultValue: 1000,
        currency: "USD",
      });

      // Second account should not be default
      const account2 = await user.mutation(api.finance.accounts.createAccount, {
        userId,
        name: "Savings Account",
        icon: "🏦",
        defaultValue: 5000,
        currency: "USD",
      });

      expect(account1.isDefault).toBe(true);
      expect(account1.displayOrder).toBe(0);
      expect(account2.isDefault).toBe(false);
      expect(account2.displayOrder).toBe(1);
    });

    test("should validate required fields", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Test empty name
      await expect(async () => {
        await user.mutation(api.finance.accounts.createAccount, {
          userId,
          name: "",
          icon: "💳",
          defaultValue: 1000,
          currency: "USD",
        });
      }).rejects.toThrow("Account name cannot be empty");
    });

    test("should validate user ownership", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");
      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      // Each user should only be able to create accounts for themselves
      const user1Account = await user1.mutation(
        api.finance.accounts.createAccount,
        {
          userId: user1Id,
          name: "User 1 Account",
          icon: "💳",
          defaultValue: 1000,
          currency: "USD",
        }
      );

      const user2Account = await user2.mutation(
        api.finance.accounts.createAccount,
        {
          userId: user2Id,
          name: "User 2 Account",
          icon: "💳",
          defaultValue: 1000,
          currency: "USD",
        }
      );

      // Verify accounts are created for the correct users
      expect(user1Account.userId).toBe(user1Id);
      expect(user2Account.userId).toBe(user2Id);
    });
  });

  describe("Account Retrieval", () => {
    test("should get user accounts ordered by display order", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Create multiple accounts
      const account1 = await user.mutation(api.finance.accounts.createAccount, {
        userId,
        name: "Checking",
        icon: "💳",
        defaultValue: 1000,
        currency: "USD",
      });

      const account2 = await user.mutation(api.finance.accounts.createAccount, {
        userId,
        name: "Savings",
        icon: "🏦",
        defaultValue: 5000,
        currency: "USD",
      });

      const accounts = await user.query(api.finance.accounts.getUserAccounts, {
        userId,
      });

      expect(accounts).toHaveLength(2);
      expect(accounts[0]._id).toBe(account1._id);
      expect(accounts[1]._id).toBe(account2._id);
      expect(accounts[0].isDefault).toBe(true);
      expect(accounts[1].isDefault).toBe(false);
    });

    test("should get account by ID with transaction count", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const account = await createTestAccount(user, {
        name: "Test Account",
        defaultValue: 1000,
      });

      // Add some transactions
      await createTestTransaction(user, account._id, { amount: -50 });
      await createTestTransaction(user, account._id, { amount: -100 });

      const accountDetails = await user.query(
        api.finance.accounts.getAccountById,
        {
          accountId: account._id,
          userId,
        }
      );

      expect(accountDetails).toMatchObject({
        name: "Test Account",
        transactionCount: 2,
      });
    });

    test("should enforce user data isolation", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      // User 1 creates account
      const user1Account = await user1.mutation(
        api.finance.accounts.createAccount,
        {
          userId: user1Id,
          name: "User 1 Account",
          icon: "💳",
          defaultValue: 1000,
          currency: "USD",
        }
      );

      // User 2 should not see User 1's accounts
      const user2Accounts = await user2.query(
        api.finance.accounts.getUserAccounts,
        {
          userId: user2Id,
        }
      );
      expect(user2Accounts).toHaveLength(0);

      // User 2 should not be able to access User 1's account
      const accessAttempt = await user2.query(
        api.finance.accounts.getAccountById,
        {
          accountId: user1Account._id,
          userId: user2Id,
        }
      );
      expect(accessAttempt).toBeNull();
    });
  });

  describe("Account Updates", () => {
    test("should update account properties", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const account = await createTestAccount(user, {
        name: "Original Name",
        description: "Original Description",
        icon: "💳",
      });

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updatedAccount = await user.mutation(
        api.finance.accounts.updateAccount,
        {
          accountId: account._id,
          userId,
          name: "Updated Name",
          description: "Updated Description",
          icon: "🏦",
          displayOrder: 5,
        }
      );

      expect(updatedAccount).toMatchObject({
        name: "Updated Name",
        description: "Updated Description",
        icon: "🏦",
        displayOrder: 5,
      });
      expect(updatedAccount.updatedAt).toBeGreaterThan(account.updatedAt);
    });

    test("should validate name is not empty", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const account = await createTestAccount(user);

      await expect(async () => {
        await user.mutation(api.finance.accounts.updateAccount, {
          accountId: account._id,
          userId,
          name: "",
        });
      }).rejects.toThrow("Account name cannot be empty");
    });

    test("should set default account correctly", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Create two accounts
      const account1 = await createTestAccount(user, { name: "Account 1" });
      const account2 = await createTestAccount(user, { name: "Account 2" });

      // Account 1 should be default initially
      expect(account1.isDefault).toBe(true);
      expect(account2.isDefault).toBe(false);

      // Set account 2 as default
      const updatedAccounts = await user.mutation(
        api.finance.accounts.setDefaultAccount,
        {
          accountId: account2._id,
          userId,
        }
      );

      const defaultAccount = updatedAccounts.find((acc) => acc.isDefault);
      const nonDefaultAccount = updatedAccounts.find((acc) => !acc.isDefault);

      expect(defaultAccount?._id).toBe(account2._id);
      expect(nonDefaultAccount?._id).toBe(account1._id);
    });
  });

  describe("Account Deletion", () => {
    test("should delete account without transactions", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const account = await createTestAccount(user, { name: "Test Account" });

      const result = await user.mutation(api.finance.accounts.deleteAccount, {
        accountId: account._id,
        userId,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("successfully");

      // Verify account is deleted
      const accountDetails = await user.query(
        api.finance.accounts.getAccountById,
        {
          accountId: account._id,
          userId,
        }
      );
      expect(accountDetails).toBeNull();
    });

    test("should prevent deletion of account with transactions", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const account = await createTestAccount(user);

      // Add a transaction
      await createTestTransaction(user, account._id, { amount: -50 });

      const result = await user.mutation(api.finance.accounts.deleteAccount, {
        accountId: account._id,
        userId,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Cannot delete account with");
      expect(result.message).toContain("transactions");
    });

    test("should reassign default when deleting default account", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Create two accounts
      const account1 = await createTestAccount(user, {
        name: "Default Account",
      });
      const account2 = await createTestAccount(user, {
        name: "Secondary Account",
      });

      // Account 1 should be default
      expect(account1.isDefault).toBe(true);

      // Delete default account
      await user.mutation(api.finance.accounts.deleteAccount, {
        accountId: account1._id,
        userId,
      });

      // Check remaining accounts
      const remainingAccounts = await user.query(
        api.finance.accounts.getUserAccounts,
        {
          userId,
        }
      );

      expect(remainingAccounts).toHaveLength(1);
      expect(remainingAccounts[0]._id).toBe(account2._id);
      expect(remainingAccounts[0].isDefault).toBe(true);
    });

    test("should enforce user ownership on deletion", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      const user1Account = await createTestAccount(user1);

      // User 2 should not be able to delete User 1's account
      await expect(async () => {
        await user2.mutation(api.finance.accounts.deleteAccount, {
          accountId: user1Account._id,
          userId: user2Id,
        });
      }).rejects.toThrow();
    });
  });

  describe("Balance Calculations", () => {
    test("should maintain accurate balances with transactions", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const account = await createTestAccount(user, {
        name: "Test Account",
        defaultValue: 1000,
      });

      // Initial balance should be default value
      expect(account.currentAmount).toBe(1000);

      // Add some transactions
      const tx1 = await createTestTransaction(user, account._id, {
        amount: -250,
        description: "Expense 1",
      });
      const tx2 = await createTestTransaction(user, account._id, {
        amount: 500,
        description: "Income",
      });
      const tx3 = await createTestTransaction(user, account._id, {
        amount: -100,
        description: "Expense 2",
      });

      // Expected balance: 1000 - 250 + 500 - 100 = 1150
      expect(tx1.newAccountBalance).toBe(750);
      expect(tx2.newAccountBalance).toBe(1250);
      expect(tx3.newAccountBalance).toBe(1150);

      // Verify final account balance
      const updatedAccount = await user.query(
        api.finance.accounts.getAccountById,
        {
          accountId: account._id,
          userId,
        }
      );
      expect(updatedAccount?.currentAmount).toBe(1150);
    });

    test("should handle decimal amounts correctly", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");

      const account = await createTestAccount(user, {
        defaultValue: 100.5,
      });

      // Add decimal transactions
      const tx1 = await createTestTransaction(user, account._id, {
        amount: -12.75,
      });
      const tx2 = await createTestTransaction(user, account._id, {
        amount: 25.25,
      });

      // Expected: 100.50 - 12.75 + 25.25 = 113.00
      assertApproximatelyEqual(tx1.newAccountBalance, 87.75);
      assertApproximatelyEqual(tx2.newAccountBalance, 113.0);
    });
  });
});
