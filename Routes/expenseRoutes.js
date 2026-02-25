const express = require("express");
const router = express.Router();
const expenseController = require("../Controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadExpenseReceipt, handleUploadErrors, handleExpenseReceiptErrors } = require("../middleware/uploadMiddleware");
const { createUploadHandler } = require("../middleware/uploadHandler");

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ========== EXPENSE ROUTES ==========
router.post("/",
  createUploadHandler(uploadExpenseReceipt.single('receipt')),
  handleUploadErrors,
  expenseController.createExpense
);

router.get("/", expenseController.getAllExpenses);
router.get("/stats", expenseController.getExpenseStats);
router.get("/export", expenseController.exportExpenses);
router.get("/:id", expenseController.getExpenseById);

router.put("/:id",
  createUploadHandler(uploadExpenseReceipt.single('receipt')),
  handleUploadErrors,
  expenseController.updateExpense
);

router.delete("/:id", expenseController.deleteExpense);
router.patch("/:id/status", expenseController.updateExpenseStatus);

// ========== BUDGET ROUTES ==========
router.post("/budgets", expenseController.createBudget);
router.get("/budgets", expenseController.getAllBudgets);
router.get("/budgets/:id", expenseController.getBudgetById);
router.put("/budgets/:id", expenseController.updateBudget);
router.delete("/budgets/:id", expenseController.deleteBudget);

// ========== VENDOR ROUTES ==========
router.post("/vendors", expenseController.createVendor);
router.get("/vendors", expenseController.getAllVendors);
router.get("/vendors/:id", expenseController.getVendorById);
router.put("/vendors/:id", expenseController.updateVendor);
router.delete("/vendors/:id", expenseController.deleteVendor);

// ========== UTILITY ROUTES ==========
router.post("/recurring/process", expenseController.processRecurringExpenses);

// DEBUG 
// Temporary debug route
// router.get("/debug/check-data", expenseController.checkData);
// router.get("/debug/check-data", expenseController.checkData);


// TEMPORARY DEBUG ROUTE - Add this before module.exports
router.get("/debug/check-data", async (req, res) => {
  try {
    const budgets = await Budget.find({});
    const vendors = await ExpenseVendor.find({});
    const expenses = await Expense.find({});
    
    res.json({
      success: true,
      counts: {
        budgets: budgets.length,
        vendors: vendors.length,
        expenses: expenses.length
      },
      data: {
        budgets,
        vendors,
        expenses
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 