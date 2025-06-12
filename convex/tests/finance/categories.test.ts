import { expect, test, describe } from "vitest";
import { api } from "../../src/_generated/api";
import { Id } from "../../src/_generated/dataModel";
import {
  createTestInstance,
  createTestUser,
  createTestAccount,
  createTestCategory,
  createTestTransaction,
  initializeTestFinanceSetup,
  getUserId,
} from "./test_utils";

describe("Category Management", () => {
  describe("Category Creation", () => {
    test("should create category with default settings", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");

      const category = await user.mutation(
        api.finance.categories.createCategory,
        {
          userId: getUserId(user),
          name: "Test Category",
          icon: "🍽️",
          color: "#FF6B6B",
        }
      );

      expect(category).toMatchObject({
        name: "Test Category",
        icon: "🍽️",
        color: "#FF6B6B",
        isDefault: false,
      });
      expect(category._id).toBeDefined();
      expect(category.createdAt).toBeDefined();
    });

    test("should use default color when not specified", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");

      const category = await user.mutation(
        api.finance.categories.createCategory,
        {
          userId: await getUserId(user),
          name: "No Color Category",
          icon: "📦",
        }
      );

      expect(category.color).toBe("#95A5A6"); // Default color
    });

    test("should validate required fields", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Test empty name
      await expect(async () => {
        await user.mutation(api.finance.categories.createCategory, {
          userId,
          name: "",
          icon: "🍽️",
        });
      }).rejects.toThrow("Category name cannot be empty");

      // Test whitespace-only name
      await expect(async () => {
        await user.mutation(api.finance.categories.createCategory, {
          userId,
          name: "   ",
          icon: "🍽️",
        });
      }).rejects.toThrow("Category name cannot be empty");
    });

    test("should prevent duplicate category names for same user", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Create first category
      await user.mutation(api.finance.categories.createCategory, {
        userId,
        name: "Food",
        icon: "🍽️",
      });

      // Try to create duplicate
      await expect(async () => {
        await user.mutation(api.finance.categories.createCategory, {
          userId,
          name: "Food",
          icon: "🥘",
        });
      }).rejects.toThrow("Category with this name already exists");
    });

    test("should allow same category names for different users", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      // Both users can have "Food" category
      const category1 = await user1.mutation(
        api.finance.categories.createCategory,
        {
          userId: user1Id,
          name: "Food",
          icon: "🍽️",
        }
      );

      const category2 = await user2.mutation(
        api.finance.categories.createCategory,
        {
          userId: user2Id,
          name: "Food",
          icon: "🍽️",
        }
      );

      expect(category1.name).toBe("Food");
      expect(category2.name).toBe("Food");
      expect(category1._id).not.toBe(category2._id);
    });
  });

  describe("Category Retrieval", () => {
    test("should get user categories with usage statistics", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const { defaultAccount, categories } = await initializeTestFinanceSetup(
        user
      );

      // Add some transactions to create usage statistics
      const foodCategory = categories.find(
        (cat) => cat.name === "Food & Dining"
      );
      if (foodCategory) {
        await createTestTransaction(user, defaultAccount._id, {
          categoryId: foodCategory._id,
          amount: -50,
          description: "Lunch",
        });
        await createTestTransaction(user, defaultAccount._id, {
          categoryId: foodCategory._id,
          amount: -30,
          description: "Coffee",
        });
      }

      const userCategories = await user.query(
        api.finance.categories.getUserCategories,
        {
          userId: await getUserId(user),
        }
      );

      expect(userCategories.length).toBeGreaterThan(0);

      // Food category should have usage statistics
      const foodCategoryWithStats = userCategories.find(
        (cat) => cat.name === "Food & Dining"
      );
      expect(foodCategoryWithStats).toMatchObject({
        name: "Food & Dining",
        usageCount: 2,
      });
    });

    test("should get default categories", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");

      const defaultCategories = await user.query(
        api.finance.categories.getDefaultCategories,
        {}
      );

      expect(defaultCategories).toHaveLength(10);
      expect(defaultCategories.map((cat) => cat.name)).toContain(
        "Food & Dining"
      );
      expect(defaultCategories.map((cat) => cat.name)).toContain(
        "Transportation"
      );
      expect(defaultCategories.map((cat) => cat.name)).toContain("Shopping");
    });

    test("should sort categories by usage frequency", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const { defaultAccount, categories } = await initializeTestFinanceSetup(
        user
      );

      // Create different usage patterns
      const foodCategory = categories.find(
        (cat) => cat.name === "Food & Dining"
      );
      const transportCategory = categories.find(
        (cat) => cat.name === "Transportation"
      );

      if (foodCategory && transportCategory) {
        // Food: 3 transactions
        await createTestTransaction(user, defaultAccount._id, {
          categoryId: foodCategory._id,
          amount: -20,
        });
        await createTestTransaction(user, defaultAccount._id, {
          categoryId: foodCategory._id,
          amount: -30,
        });
        await createTestTransaction(user, defaultAccount._id, {
          categoryId: foodCategory._id,
          amount: -25,
        });

        // Transport: 1 transaction
        await createTestTransaction(user, defaultAccount._id, {
          categoryId: transportCategory._id,
          amount: -50,
        });
      }

      const sortedCategories = await user.query(
        api.finance.categories.getUserCategories,
        {
          userId: await getUserId(user),
        }
      );

      // Categories should be sorted by transaction count (descending)
      const foodIndex = sortedCategories.findIndex(
        (cat) => cat.name === "Food & Dining"
      );
      const transportIndex = sortedCategories.findIndex(
        (cat) => cat.name === "Transportation"
      );

      expect(foodIndex).toBeLessThan(transportIndex);
      expect(sortedCategories[foodIndex].usageCount).toBe(3);
      expect(sortedCategories[transportIndex].usageCount).toBe(1);
    });

    test("should enforce user data isolation", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      // User 1 creates a category
      await user1.mutation(api.finance.categories.createCategory, {
        userId: user1Id,
        name: "User 1 Category",
        icon: "📦",
      });

      // User 2 should not see User 1's categories
      const user2Categories = await user2.query(
        api.finance.categories.getUserCategories,
        {
          userId: user2Id,
        }
      );

      expect(
        user2Categories.find((cat) => cat.name === "User 1 Category")
      ).toBeUndefined();
    });
  });

  describe("Category Updates", () => {
    test("should update category properties", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const category = await createTestCategory(user, {
        name: "Original Name",
        icon: "📦",
        color: "#FF0000",
      });

      const updatedCategory = await user.mutation(
        api.finance.categories.updateCategory,
        {
          categoryId: category._id,
          userId,
          name: "Updated Name",
          icon: "📝",
          color: "#00FF00",
        }
      );

      expect(updatedCategory).toMatchObject({
        name: "Updated Name",
        icon: "📝",
        color: "#00FF00",
      });
    });

    test("should validate name uniqueness when updating", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Create two categories
      const category1 = await createTestCategory(user, { name: "Category 1" });
      const category2 = await createTestCategory(user, { name: "Category 2" });

      // Try to update category2 to have same name as category1
      await expect(async () => {
        await user.mutation(api.finance.categories.updateCategory, {
          categoryId: category2._id,
          userId,
          name: "Category 1",
        });
      }).rejects.toThrow("Category with this name already exists");
    });

    test("should allow partial updates", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const category = await createTestCategory(user, {
        name: "Original",
        icon: "📦",
        color: "#FF0000",
      });

      // Update only the icon
      const updatedCategory = await user.mutation(
        api.finance.categories.updateCategory,
        {
          categoryId: category._id,
          userId,
          icon: "📝",
        }
      );

      expect(updatedCategory).toMatchObject({
        name: "Original", // Unchanged
        icon: "📝", // Changed
        color: "#FF0000", // Unchanged
      });
    });

    test("should validate empty names", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const category = await createTestCategory(user);

      await expect(async () => {
        await user.mutation(api.finance.categories.updateCategory, {
          categoryId: category._id,
          userId,
          name: "",
        });
      }).rejects.toThrow("Category name cannot be empty");
    });

    test("should enforce user ownership", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      const user1Category = await createTestCategory(user1);

      // User 2 should not be able to update User 1's category
      await expect(async () => {
        await user2.mutation(api.finance.categories.updateCategory, {
          categoryId: user1Category._id,
          userId: user2Id,
          name: "Hacked Name",
        });
      }).rejects.toThrow("Unauthorized");
    });
  });

  describe("Category Deletion", () => {
    test("should delete unused category", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const category = await createTestCategory(user, {
        name: "Unused Category",
      });

      const result = await user.mutation(
        api.finance.categories.deleteCategory,
        {
          categoryId: category._id,
          userId,
        }
      );

      expect(result.success).toBe(true);
      expect(result.reassignedTransactions).toBe(0);
      expect(result.message).not.toContain("reassigned");
    });

    test("should reassign transactions when deleting used category", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);
      const { defaultAccount } = await initializeTestFinanceSetup(user);

      const category = await createTestCategory(user, { name: "To Delete" });

      // Add transactions to this category
      await createTestTransaction(user, defaultAccount._id, {
        categoryId: category._id,
        amount: -50,
      });
      await createTestTransaction(user, defaultAccount._id, {
        categoryId: category._id,
        amount: -30,
      });

      const result = await user.mutation(
        api.finance.categories.deleteCategory,
        {
          categoryId: category._id,
          userId,
        }
      );

      expect(result.success).toBe(true);
      expect(result.reassignedTransactions).toBe(2);
      expect(result.message).toContain("2 transactions were reassigned");

      // Verify transactions were reassigned to "Other" category
      const transactions = await user.query(
        api.finance.transactions.getUserTransactions,
        {
          userId,
          paginationOpts: { numItems: 100, cursor: null },
        }
      );

      const reassignedTransactions = transactions.page.filter(
        (tx) =>
          tx.categoryName === "Other" && [50, 30].includes(Math.abs(tx.amount))
      );
      expect(reassignedTransactions).toHaveLength(2);
    });

    test("should create Other category if it doesn't exist", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);
      const { defaultAccount } = await initializeTestFinanceSetup(user);

      const category = await createTestCategory(user, { name: "To Delete" });

      // Add a transaction to this category
      await createTestTransaction(user, defaultAccount._id, {
        categoryId: category._id,
        amount: -50,
      });

      // Delete the category (should create "Other" category)
      await user.mutation(api.finance.categories.deleteCategory, {
        categoryId: category._id,
        userId,
      });

      // Check that "Other" category was created
      const categories = await user.query(
        api.finance.categories.getUserCategories,
        {
          userId,
        }
      );

      const otherCategory = categories.find((cat) => cat.name === "Other");
      expect(otherCategory).toBeDefined();
      expect(otherCategory?.isDefault).toBe(true);
      expect(otherCategory?.color).toBe("#95A5A6");
    });

    test("should allow specifying reassignment category", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);
      const { defaultAccount } = await initializeTestFinanceSetup(user);

      const categoryToDelete = await createTestCategory(user, {
        name: "To Delete",
      });
      const targetCategory = await createTestCategory(user, { name: "Target" });

      // Add transaction to category being deleted
      await createTestTransaction(user, defaultAccount._id, {
        categoryId: categoryToDelete._id,
        amount: -50,
      });

      const result = await user.mutation(
        api.finance.categories.deleteCategory,
        {
          categoryId: categoryToDelete._id,
          userId,
          reassignToCategory: targetCategory._id,
        }
      );

      expect(result.success).toBe(true);
      expect(result.reassignedTransactions).toBe(1);

      // Verify transaction was reassigned to target category
      const transactions = await user.query(
        api.finance.transactions.getUserTransactions,
        {
          userId,
          paginationOpts: { numItems: 100, cursor: null },
        }
      );

      const reassignedTransaction = transactions.page.find(
        (tx) => tx.categoryId === targetCategory._id && tx.amount === -50
      );
      expect(reassignedTransaction).toBeDefined();
    });

    test("should validate reassignment category ownership", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      const { defaultAccount: user1Account } = await initializeTestFinanceSetup(
        user1
      );
      const user1Category = await createTestCategory(user1);
      const user2Category = await createTestCategory(user2);

      // Add a transaction to user1's category to ensure the reassignment logic is triggered
      await createTestTransaction(user1, user1Account._id, {
        categoryId: user1Category._id,
        amount: -50,
      });

      // User 1 should not be able to reassign to User 2's category
      await expect(async () => {
        await user1.mutation(api.finance.categories.deleteCategory, {
          categoryId: user1Category._id,
          userId: user1Id,
          reassignToCategory: user2Category._id,
        });
      }).rejects.toThrow("Invalid reassignment category");
    });

    test("should enforce user ownership on deletion", async () => {
      const t = createTestInstance();
      const user1 = await createTestUser(t, "User 1");
      const user2 = await createTestUser(t, "User 2");

      const user1Id = await getUserId(user1);
      const user2Id = await getUserId(user2);

      const user1Category = await createTestCategory(user1);

      // User 2 should not be able to delete User 1's category
      await expect(async () => {
        await user2.mutation(api.finance.categories.deleteCategory, {
          categoryId: user1Category._id,
          userId: user2Id,
        });
      }).rejects.toThrow("Unauthorized");
    });
  });

  describe("Default Categories Initialization", () => {
    test("should initialize default categories for new user", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      const categoryIds = await user.mutation(
        api.finance.categories.initializeDefaultCategories,
        {
          userId,
        }
      );

      expect(categoryIds).toHaveLength(10);

      // Verify categories were created
      const categories = await user.query(
        api.finance.categories.getUserCategories,
        {
          userId,
        }
      );

      expect(categories).toHaveLength(10);
      expect(categories.every((cat) => cat.isDefault)).toBe(true);

      // Check that all expected default categories are present
      const categoryNames = categories.map((cat) => cat.name);
      expect(categoryNames).toContain("Food & Dining");
      expect(categoryNames).toContain("Transportation");
      expect(categoryNames).toContain("Shopping");
      expect(categoryNames).toContain("Entertainment");
      expect(categoryNames).toContain("Bills & Utilities");
      expect(categoryNames).toContain("Healthcare");
      expect(categoryNames).toContain("Education");
      expect(categoryNames).toContain("Travel");
      expect(categoryNames).toContain("Income");
      expect(categoryNames).toContain("Other");
    });

    test("should not create duplicates if categories already exist", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const userId = await getUserId(user);

      // Create a default category manually first
      await user.mutation(api.finance.categories.createCategory, {
        userId,
        name: "Food & Dining",
        icon: "🍽️",
      });

      // Initialize default categories
      const categoryIds = await user.mutation(
        api.finance.categories.initializeDefaultCategories,
        {
          userId,
        }
      );

      expect(categoryIds).toHaveLength(9); // Only 9 new categories created

      // Verify no duplicates
      const categories = await user.query(
        api.finance.categories.getUserCategories,
        {
          userId,
        }
      );

      const foodCategories = categories.filter(
        (cat) => cat.name === "Food & Dining"
      );
      expect(foodCategories).toHaveLength(1);
    });
  });

  describe("Category Integration with Finance Setup", () => {
    test("should work seamlessly with initializeTestFinanceSetup", async () => {
      const t = createTestInstance();
      const user = await createTestUser(t, "Test User");
      const { categories, defaultAccount } = await initializeTestFinanceSetup(
        user
      );

      expect(categories).toHaveLength(10);
      expect(categories.every((cat) => cat.isDefault)).toBe(true);

      // Should be able to use categories immediately for transactions
      const foodCategory = categories.find(
        (cat) => cat.name === "Food & Dining"
      );
      expect(foodCategory).toBeDefined();

      if (foodCategory) {
        const transaction = await createTestTransaction(
          user,
          defaultAccount._id,
          {
            categoryId: foodCategory._id,
            amount: -25.5,
            description: "Lunch at cafe",
          }
        );

        expect(transaction.categoryId).toBe(foodCategory._id);
      }
    });
  });
});
