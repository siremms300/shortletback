const { Expense, Budget, ExpenseVendor } = require("../Models/ExpenseModels");
const Property = require("../Models/PropertyModel");
const mongoose = require("mongoose");

const expenseController = {
  // ========== EXPENSE METHODS ==========

  // Create new expense
  // createExpense: async (req, res) => {
  //   try {
  //     const {
  //       date,
  //       category,
  //       description,
  //       amount,
  //       propertyId,
  //       unit,
  //       paidTo,
  //       paymentMethod,
  //       recurring,
  //       recurrence,
  //       tags,
  //       notes,
  //       budgetCategory,
  //       taxDeductible
  //     } = req.body;

  //     console.log('Creating expense:', req.body);

  //     // Validate required fields
  //     if (!category || !description || !amount || !propertyId || !paidTo || !paymentMethod) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Category, description, amount, property, paidTo, and paymentMethod are required"
  //       });
  //     }

  //     // Check if property exists
  //     const property = await Property.findById(propertyId);
  //     if (!property) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Property not found"
  //       });
  //     }

  //     // Handle receipt upload if any
  //     let receiptUrl = '';
  //     let receiptFileId = '';
      
  //     if (req.file) {
  //       // If using Cloudinary
  //       if (req.file.cloudinary) {
  //         receiptUrl = req.file.cloudinary.url;
  //         receiptFileId = req.file.cloudinary.public_id;
  //       } else {
  //         // Local file storage
  //         receiptUrl = `/uploads/expenses/${req.file.filename}`;
  //       }
  //     }

  //     const expense = new Expense({
  //       date: date || new Date(),
  //       category,
  //       description,
  //       amount: parseFloat(amount),
  //       property: propertyId,
  //       unit: unit || '',
  //       paidTo,
  //       paymentMethod,
  //       receipt: receiptUrl,
  //       receiptFileId,
  //       recurring: recurring || false,
  //       recurrence: recurring ? recurrence : undefined,
  //       tags: tags || [],
  //       notes: notes || '',
  //       budgetCategory: budgetCategory || '',
  //       taxDeductible: taxDeductible !== undefined ? taxDeductible : true,
  //       createdBy: req.user.id
  //     });

  //     // If recurring, calculate next recurrence date
  //     if (expense.recurring && expense.recurrence) {
  //       const nextDate = new Date(expense.date);
  //       switch (expense.recurrence) {
  //         case 'weekly':
  //           nextDate.setDate(nextDate.getDate() + 7);
  //           break;
  //         case 'monthly':
  //           nextDate.setMonth(nextDate.getMonth() + 1);
  //           break;
  //         case 'quarterly':
  //           nextDate.setMonth(nextDate.getMonth() + 3);
  //           break;
  //         case 'yearly':
  //           nextDate.setFullYear(nextDate.getFullYear() + 1);
  //           break;
  //       }
  //       expense.nextRecurrenceDate = nextDate;
  //     }

  //     await expense.save();

  //     // Populate related fields
  //     await expense.populate('property', 'title location');
  //     await expense.populate('createdBy', 'firstName lastName');
  //     if (expense.approvedBy) {
  //       await expense.populate('approvedBy', 'firstName lastName');
  //     }

  //     // Update budget spent amount if budget category is specified
  //     if (expense.budgetCategory && expense.status === 'approved') {
  //       await updateBudgetSpent(expense.budgetCategory, expense.amount);
  //     }

  //     res.status(201).json({
  //       success: true,
  //       message: "Expense created successfully",
  //       expense
  //     });

  //   } catch (error) {
  //     console.error('Create expense error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to create expense",
  //       error: error.message
  //     });
  //   }
  // },


// Create new expense
createExpense: async (req, res) => {
  try {
    const {
      date,
      category,
      description,
      amount,
      propertyId,
      unit,
      paidTo,
      paymentMethod,
      recurring,
      recurrence,
      tags,
      notes,
      budgetCategory,
      taxDeductible
    } = req.body;

    console.log('========== CREATE EXPENSE ==========');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User:', req.user?.id);

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!category) missingFields.push('category');
    if (!description) missingFields.push('description');
    if (!amount) missingFields.push('amount');
    if (!propertyId) missingFields.push('propertyId');
    if (!paidTo) missingFields.push('paidTo');
    if (!paymentMethod) missingFields.push('paymentMethod');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log('Property not found:', propertyId);
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Handle receipt upload if any
    let receiptUrl = '';
    let receiptFileId = '';
    
    if (req.file) {
      console.log('Receipt file received:', req.file.originalname);
      // If using Cloudinary
      if (req.file.cloudinary) {
        receiptUrl = req.file.cloudinary.url;
        receiptFileId = req.file.cloudinary.public_id;
        console.log('Cloudinary URL:', receiptUrl);
      } else {
        // Local file storage
        receiptUrl = `/uploads/expenses/${req.file.filename}`;
        console.log('Local file path:', receiptUrl);
      }
    }

    // Parse amount as float
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number"
      });
    }

    const expense = new Expense({
      date: date || new Date(),
      category,
      description,
      amount: parsedAmount,
      property: propertyId,
      unit: unit || '',
      paidTo,
      paymentMethod,
      receipt: receiptUrl,
      receiptFileId,
      recurring: recurring === true || recurring === 'true',
      recurrence: (recurring === true || recurring === 'true') ? recurrence : undefined,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      notes: notes || '',
      budgetCategory: budgetCategory || '',
      taxDeductible: taxDeductible === true || taxDeductible === 'true',
      createdBy: req.user.id
    });

    console.log('Expense object before save:', expense);

    // If recurring, calculate next recurrence date
    if (expense.recurring && expense.recurrence) {
      const nextDate = new Date(expense.date);
      switch (expense.recurrence) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      expense.nextRecurrenceDate = nextDate;
    }

    await expense.save();
    console.log('Expense saved with ID:', expense._id);

    // Populate related fields
    await expense.populate('property', 'title location');
    await expense.populate('createdBy', 'firstName lastName');
    
    console.log('Expense created successfully');
    console.log('====================================');

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense
    });

  } catch (error) {
    console.error('========== CREATE EXPENSE ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message
    });
  }
},





  // Get all expenses
  getAllExpenses: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        category,
        status,
        propertyId,
        startDate,
        endDate,
        search,
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query;

      const query = {};

      // Apply filters
      if (category && category !== 'all') query.category = category;
      if (status && status !== 'all') query.status = status;
      if (propertyId && propertyId !== 'all') query.property = propertyId;

      // Date range filter
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      // Search in description, paidTo, notes
      if (search) {
        query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { paidTo: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          { expenseNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const expenses = await Expense.find(query)
        .populate('property', 'title location')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Expense.countDocuments(query);

      // Calculate statistics
      const stats = await calculateExpenseStats(query);

      res.status(200).json({
        success: true,
        expenses,
        stats,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch expenses",
        error: error.message
      });
    }
  },

  // Get expense by ID
  getExpenseById: async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await Expense.findById(id)
        .populate('property', 'title location')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName');

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: "Expense not found"
        });
      }

      res.status(200).json({
        success: true,
        expense
      });

    } catch (error) {
      console.error('Get expense error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch expense",
        error: error.message
      });
    }
  },

  // Update expense
  updateExpense: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const expense = await Expense.findById(id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: "Expense not found"
        });
      }

      // Handle receipt upload if any
      if (req.file) {
        if (req.file.cloudinary) {
          updateData.receipt = req.file.cloudinary.url;
          updateData.receiptFileId = req.file.cloudinary.public_id;
        } else {
          updateData.receipt = `/uploads/expenses/${req.file.filename}`;
        }
      }

      // If amount changed and expense is approved, update budget
      const oldAmount = expense.amount;
      const newAmount = updateData.amount !== undefined ? parseFloat(updateData.amount) : oldAmount;

      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('property', 'title location')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName');

      // Update budget if amount changed and expense is approved
      if (updatedExpense.budgetCategory && updatedExpense.status === 'approved') {
        if (oldAmount !== newAmount) {
          await updateBudgetSpent(updatedExpense.budgetCategory, newAmount - oldAmount);
        }
      }

      res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense
      });

    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update expense",
        error: error.message
      });
    }
  },

  // Delete expense
  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;

      const expense = await Expense.findById(id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: "Expense not found"
        });
      }

      // Update budget if expense was approved
      if (expense.budgetCategory && expense.status === 'approved') {
        await updateBudgetSpent(expense.budgetCategory, -expense.amount);
      }

      await Expense.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Expense deleted successfully"
      });

    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete expense",
        error: error.message
      });
    }
  },

  // Update expense status
  updateExpenseStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const expense = await Expense.findById(id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: "Expense not found"
        });
      }

      const oldStatus = expense.status;

      expense.status = status;
      if (status === 'approved') {
        expense.approvedBy = req.user.id;
        expense.approvedAt = new Date();
      } else if (status === 'paid') {
        expense.paidAt = new Date();
      }
      if (notes) expense.notes = notes;

      await expense.save();

      // Update budget if status changed to approved
      if (oldStatus !== 'approved' && status === 'approved' && expense.budgetCategory) {
        await updateBudgetSpent(expense.budgetCategory, expense.amount);
      }

      // Update budget if status changed from approved to something else
      if (oldStatus === 'approved' && status !== 'approved' && expense.budgetCategory) {
        await updateBudgetSpent(expense.budgetCategory, -expense.amount);
      }

      await expense.populate('approvedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: "Expense status updated successfully",
        expense
      });

    } catch (error) {
      console.error('Update expense status error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update expense status",
        error: error.message
      });
    }
  },

  // ========== BUDGET METHODS ==========

  // Create budget
  // createBudget: async (req, res) => {
  //   try {
  //     const {
  //       category,
  //       allocated,
  //       period,
  //       fiscalYear,
  //       startDate,
  //       endDate,
  //       notes
  //     } = req.body;

  //     // Check if budget already exists for this category and period
  //     const existingBudget = await Budget.findOne({
  //       category,
  //       period,
  //       fiscalYear
  //     });

  //     if (existingBudget) {
  //       return res.status(400).json({
  //         success: false,
  //         message: `Budget for ${category} (${period} ${fiscalYear}) already exists`
  //       });
  //     }

  //     const budget = new Budget({
  //       category,
  //       allocated: parseFloat(allocated),
  //       period,
  //       fiscalYear: parseInt(fiscalYear),
  //       startDate: startDate || new Date(fiscalYear, 0, 1),
  //       endDate: endDate || new Date(fiscalYear, 11, 31),
  //       notes: notes || '',
  //       createdBy: req.user.id
  //     });

  //     await budget.save();
  //     await budget.populate('createdBy', 'firstName lastName');

  //     res.status(201).json({
  //       success: true,
  //       message: "Budget created successfully",
  //       budget
  //     });

  //   } catch (error) {
  //     console.error('Create budget error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to create budget",
  //       error: error.message
  //     });
  //   }
  // },


// Create budget
createBudget: async (req, res) => {
  try {
    const {
      category,
      allocated,
      period,
      fiscalYear,
      notes
    } = req.body;

    console.log('========== CREATE BUDGET ==========');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.id);

    // Validate required fields
    const missingFields = [];
    if (!category) missingFields.push('category');
    if (!allocated) missingFields.push('allocated');
    if (!period) missingFields.push('period');
    if (!fiscalYear) missingFields.push('fiscalYear');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Parse numeric values
    const parsedAllocated = parseFloat(allocated);
    if (isNaN(parsedAllocated) || parsedAllocated <= 0) {
      return res.status(400).json({
        success: false,
        message: "Allocated amount must be a positive number"
      });
    }

    const parsedFiscalYear = parseInt(fiscalYear);
    if (isNaN(parsedFiscalYear) || parsedFiscalYear < 2000 || parsedFiscalYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid fiscal year"
      });
    }

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      category,
      period,
      fiscalYear: parsedFiscalYear
    });

    if (existingBudget) {
      console.log('Budget already exists:', existingBudget);
      return res.status(400).json({
        success: false,
        message: `Budget for ${category} (${period} ${parsedFiscalYear}) already exists`
      });
    }

    // Calculate start and end dates based on period
    let startDate, endDate;
    
    if (period === 'yearly') {
      startDate = new Date(parsedFiscalYear, 0, 1);
      endDate = new Date(parsedFiscalYear, 11, 31);
    } else if (period === 'monthly') {
      // For monthly, we'll use the current month of the fiscal year
      // This is simplified - you might want to handle this differently
      startDate = new Date(parsedFiscalYear, 0, 1);
      endDate = new Date(parsedFiscalYear, 11, 31);
    } else if (period === 'quarterly') {
      startDate = new Date(parsedFiscalYear, 0, 1);
      endDate = new Date(parsedFiscalYear, 11, 31);
    }

    const budget = new Budget({
      category,
      allocated: parsedAllocated,
      spent: 0,
      period,
      fiscalYear: parsedFiscalYear,
      startDate,
      endDate,
      notes: notes || '',
      createdBy: req.user.id
    });

    console.log('Budget object before save:', budget);

    await budget.save();
    console.log('Budget saved with ID:', budget._id);

    await budget.populate('createdBy', 'firstName lastName');

    console.log('Budget created successfully');
    console.log('====================================');

    res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget
    });

  } catch (error) {
    console.error('========== CREATE BUDGET ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Budget with this category already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create budget",
      error: error.message
    });
  }
},



  // Get all budgets
  // getAllBudgets: async (req, res) => {
  //   try {
  //     const {
  //       period,
  //       fiscalYear,
  //       isActive
  //     } = req.query;

  //     const query = {};

  //     if (period && period !== 'all') query.period = period;
  //     if (fiscalYear) query.fiscalYear = parseInt(fiscalYear);
  //     if (isActive !== undefined) query.isActive = isActive === 'true';

  //     const budgets = await Budget.find(query)
  //       .populate('createdBy', 'firstName lastName')
  //       .populate('updatedBy', 'firstName lastName')
  //       .sort({ category: 1 });

  //     res.status(200).json({
  //       success: true,
  //       budgets
  //     });

  //   } catch (error) {
  //     console.error('Get budgets error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to fetch budgets",
  //       error: error.message
  //     });
  //   }
  // },

  // Get budget by ID
  getBudgetById: async (req, res) => {
    try {
      const { id } = req.params;

      const budget = await Budget.findById(id)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: "Budget not found"
        });
      }

      // Get expenses for this budget
      const expenses = await Expense.find({
        budgetCategory: budget.category,
        status: { $in: ['approved', 'paid'] },
        date: { $gte: budget.startDate, $lte: budget.endDate }
      })
        .populate('property', 'title')
        .sort({ date: -1 });

      res.status(200).json({
        success: true,
        budget,
        expenses
      });

    } catch (error) {
      console.error('Get budget error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch budget",
        error: error.message
      });
    }
  },

  // Update budget
  updateBudget: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      updateData.updatedBy = req.user.id;

      const budget = await Budget.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: "Budget not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Budget updated successfully",
        budget
      });

    } catch (error) {
      console.error('Update budget error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update budget",
        error: error.message
      });
    }
  },

  // Delete budget
  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;

      const budget = await Budget.findById(id);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: "Budget not found"
        });
      }

      // Check if there are expenses using this budget
      const expensesUsingBudget = await Expense.countDocuments({
        budgetCategory: budget.category,
        status: 'approved'
      });

      if (expensesUsingBudget > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete budget. ${expensesUsingBudget} approved expenses are using this budget.`
        });
      }

      await Budget.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Budget deleted successfully"
      });

    } catch (error) {
      console.error('Delete budget error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete budget",
        error: error.message
      });
    }
  },

  // ========== VENDOR METHODS ==========

  // Create vendor
  createVendor: async (req, res) => {
    try {
      const {
        name,
        category,
        contactPerson,
        phone,
        email,
        address,
        taxId,
        paymentTerms,
        preferred,
        rating,
        notes
      } = req.body;

      console.log('Creating vendor with data:', req.body);

      // Validate required fields
      if (!name || !category || !phone || !email) {
        return res.status(400).json({
          success: false,
          message: "Name, category, phone, and email are required"
        });
      }

      // Check if vendor already exists
      const existingVendor = await ExpenseVendor.findOne({
        $or: [
          { email: email.toLowerCase() },
          { name: { $regex: new RegExp(`^${name}$`, 'i') } }
        ]
      });

      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: "Vendor with this name or email already exists"
        });
      }

      // Create vendor WITHOUT setting vendorNumber - let the pre-save hook handle it
      const vendorData = {
        name,
        category,
        contactPerson: contactPerson || {},
        phone,
        email: email.toLowerCase(),
        address: address || {},
        taxId: taxId || '',
        paymentTerms: paymentTerms || 'net30',
        preferred: preferred || false,
        rating: rating || 3,
        notes: notes || '',
        createdBy: req.user.id
      };

      console.log('Vendor data before save:', vendorData);

      const vendor = new ExpenseVendor(vendorData);
      await vendor.save();
      
      console.log('Vendor saved successfully:', vendor);

      await vendor.populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: "Vendor created successfully",
        vendor
      });

    } catch (error) {
      console.error('Create vendor error:', error);
      
      // Check for validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to create vendor",
        error: error.message
      });
    }
  },

  // Get all vendors
  // getAllVendors: async (req, res) => {
  //   try {
  //     const {
  //       category,
  //       preferred,
  //       search,
  //       page = 1,
  //       limit = 50
  //     } = req.query;

  //     const query = { isActive: true };

  //     if (category && category !== 'all') query.category = category;
  //     if (preferred !== undefined) query.preferred = preferred === 'true';

  //     if (search) {
  //       query.$or = [
  //         { name: { $regex: search, $options: 'i' } },
  //         { email: { $regex: search, $options: 'i' } },
  //         { 'contactPerson.name': { $regex: search, $options: 'i' } }
  //       ];
  //     }

  //     const vendors = await ExpenseVendor.find(query)
  //       .populate('createdBy', 'firstName lastName')
  //       .sort({ preferred: -1, name: 1 })
  //       .limit(limit * 1)
  //       .skip((page - 1) * limit);

  //     const total = await ExpenseVendor.countDocuments(query);

  //     res.status(200).json({
  //       success: true,
  //       vendors,
  //       totalPages: Math.ceil(total / limit),
  //       currentPage: page,
  //       total
  //     });

  //   } catch (error) {
  //     console.error('Get vendors error:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to fetch vendors",
  //       error: error.message
  //     });
  //   }
  // },





// Get all budgets - SIMPLIFIED VERSION
getAllBudgets: async (req, res) => {
  try {
    console.log('========== GET ALL BUDGETS ==========');
    
    // Try to get all budgets without any filters first
    const budgets = await Budget.find({})
      .populate('createdBy', 'firstName lastName')
      .sort({ category: 1 });

    console.log(`Found ${budgets.length} budgets`);
    console.log('Budgets:', budgets);

    res.status(200).json({
      success: true,
      budgets
    });

  } catch (error) {
    console.error('========== GET BUDGETS ERROR ==========');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch budgets",
      error: error.message
    });
  }
},

// Get all vendors - SIMPLIFIED VERSION
getAllVendors: async (req, res) => {
  try {
    console.log('========== GET ALL VENDORS ==========');
    
    // Try to get all vendors without any filters first
    const vendors = await ExpenseVendor.find({})
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    console.log(`Found ${vendors.length} vendors`);
    console.log('Vendors:', vendors);

    res.status(200).json({
      success: true,
      vendors
    });

  } catch (error) {
    console.error('========== GET VENDORS ERROR ==========');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendors",
      error: error.message
    });
  }
},






  // Get vendor by ID
  getVendorById: async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await ExpenseVendor.findById(id)
        .populate('createdBy', 'firstName lastName');

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found"
        });
      }

      // Get recent expenses from this vendor
      const recentExpenses = await Expense.find({
        paidTo: { $regex: new RegExp(vendor.name, 'i') }
      })
        .populate('property', 'title')
        .sort({ date: -1 })
        .limit(10);

      res.status(200).json({
        success: true,
        vendor,
        recentExpenses
      });

    } catch (error) {
      console.error('Get vendor error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendor",
        error: error.message
      });
    }
  },

  // Update vendor
  updateVendor: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vendor = await ExpenseVendor.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName');

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Vendor updated successfully",
        vendor
      });

    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update vendor",
        error: error.message
      });
    }
  },

  // Delete vendor (soft delete)
  deleteVendor: async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await ExpenseVendor.findById(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found"
        });
      }

      // Check if vendor has expenses
      const expensesUsingVendor = await Expense.countDocuments({
        paidTo: { $regex: new RegExp(vendor.name, 'i') }
      });

      if (expensesUsingVendor > 0) {
        // Soft delete instead
        vendor.isActive = false;
        await vendor.save();
        
        return res.status(200).json({
          success: true,
          message: "Vendor deactivated successfully (has existing expenses)"
        });
      }

      await ExpenseVendor.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Vendor deleted successfully"
      });

    } catch (error) {
      console.error('Delete vendor error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete vendor",
        error: error.message
      });
    }
  },

  // ========== REPORT METHODS ==========

  // Get expense statistics
  getExpenseStats: async (req, res) => {
    try {
      const { period = 'month', year = new Date().getFullYear() } = req.query;

      let startDate, endDate;

      switch (period) {
        case 'month':
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31);
          break;
        case 'quarter':
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31);
          break;
        case 'year':
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31);
          break;
        default:
          startDate = new Date(year, 0, 1);
          endDate = new Date(year, 11, 31);
      }

      const matchStage = {
        date: { $gte: startDate, $lte: endDate }
      };

      // Monthly breakdown
      const monthlyStats = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $month: '$date' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
            },
            paid: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Category breakdown
      const categoryStats = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);

      // Property breakdown
      const propertyStats = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$property',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]);

      await Expense.populate(propertyStats, { path: '_id', select: 'title' });

      // Status breakdown
      const statusStats = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Tax deductible total
      const taxDeductibleTotal = await Expense.aggregate([
        {
          $match: {
            ...matchStage,
            taxDeductible: true,
            status: { $in: ['approved', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Budget vs actual
      const budgetVsActual = await Budget.aggregate([
        { $match: { fiscalYear: parseInt(year), isActive: true } },
        {
          $lookup: {
            from: 'expenses',
            let: { category: '$category', start: '$startDate', end: '$endDate' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$budgetCategory', '$$category'] },
                      { $gte: ['$date', '$$start'] },
                      { $lte: ['$date', '$$end'] },
                      { $in: ['$status', ['approved', 'paid']] }
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  actual: { $sum: '$amount' }
                }
              }
            ],
            as: 'expenses'
          }
        },
        {
          $addFields: {
            actual: { $ifNull: [{ $arrayElemAt: ['$expenses.actual', 0] }, 0] },
            variance: { $subtract: ['$allocated', { $ifNull: [{ $arrayElemAt: ['$expenses.actual', 0] }, 0] }] }
          }
        },
        { $project: { expenses: 0 } }
      ]);

      res.status(200).json({
        success: true,
        stats: {
          monthly: monthlyStats,
          byCategory: categoryStats,
          byProperty: propertyStats,
          byStatus: statusStats,
          taxDeductible: taxDeductibleTotal[0]?.total || 0,
          budgetVsActual
        }
      });

    } catch (error) {
      console.error('Get expense stats error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch expense statistics",
        error: error.message
      });
    }
  },

  // Export expenses to CSV
  exportExpenses: async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        category,
        status,
        propertyId
      } = req.query;

      const query = {};

      if (category && category !== 'all') query.category = category;
      if (status && status !== 'all') query.status = status;
      if (propertyId && propertyId !== 'all') query.property = propertyId;
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const expenses = await Expense.find(query)
        .populate('property', 'title')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort({ date: -1 });

      // Generate CSV
      const csvRows = [];
      csvRows.push('Expense Number,Date,Category,Description,Amount,Property,Unit,Paid To,Payment Method,Status,Tax Deductible,Tags,Notes');

      for (const expense of expenses) {
        csvRows.push([
          expense.expenseNumber,
          new Date(expense.date).toISOString().split('T')[0],
          expense.category,
          `"${expense.description.replace(/"/g, '""')}"`,
          expense.amount,
          expense.property?.title || 'Unknown',
          expense.unit || '',
          `"${expense.paidTo.replace(/"/g, '""')}"`,
          expense.paymentMethod,
          expense.status,
          expense.taxDeductible ? 'Yes' : 'No',
          expense.tags.join('; '),
          `"${(expense.notes || '').replace(/"/g, '""')}"`
        ].join(','));
      }

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=expenses-${new Date().toISOString().split('T')[0]}.csv`);
      res.status(200).send(csv);

    } catch (error) {
      console.error('Export expenses error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to export expenses",
        error: error.message
      });
    }
  },

  // Process recurring expenses (to be called by cron job)
  processRecurringExpenses: async (req, res) => {
    try {
      const today = new Date();
      
      const recurringExpenses = await Expense.find({
        recurring: true,
        nextRecurrenceDate: { $lte: today },
        status: { $in: ['approved', 'paid'] }
      });

      const created = [];

      for (const expense of recurringExpenses) {
        // Create new expense based on recurring template
        const newExpense = new Expense({
          ...expense.toObject(),
          _id: new mongoose.Types.ObjectId(),
          expenseNumber: undefined, // Will be generated
          date: today,
          status: 'pending',
          approvedBy: undefined,
          approvedAt: undefined,
          paidAt: undefined,
          recurring: true,
          nextRecurrenceDate: undefined,
          createdBy: expense.createdBy
        });

        // Calculate next recurrence date
        const nextDate = new Date(today);
        switch (expense.recurrence) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }
        
        // Update original expense's next recurrence date
        expense.nextRecurrenceDate = nextDate;
        await expense.save();

        // Save new expense
        await newExpense.save();
        created.push(newExpense);
      }

      res.status(200).json({
        success: true,
        message: `Processed ${created.length} recurring expenses`,
        created
      });

    } catch (error) {
      console.error('Process recurring expenses error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to process recurring expenses",
        error: error.message
      });
    }
  }
};

// Helper function to update budget spent amount
async function updateBudgetSpent(budgetCategory, amountChange) {
  try {
    const budget = await Budget.findOne({ category: budgetCategory });
    if (budget) {
      budget.spent = (budget.spent || 0) + amountChange;
      await budget.save();
    }
  } catch (error) {
    console.error('Error updating budget spent:', error);
  }
}

// Helper function to calculate expense statistics
async function calculateExpenseStats(query) {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthQuery = { ...query, date: { $gte: currentMonth, $lt: nextMonth } };

    const [
      monthlyExpenses,
      pendingApproval,
      approvedThisMonth,
      taxDeductible
    ] = await Promise.all([
      Expense.aggregate([
        { $match: monthQuery },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...query, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...monthQuery, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...query, taxDeductible: true, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    return {
      monthlyTotal: monthlyExpenses[0]?.total || 0,
      monthlyCount: monthlyExpenses[0]?.count || 0,
      pendingTotal: pendingApproval[0]?.total || 0,
      pendingCount: pendingApproval[0]?.count || 0,
      approvedThisMonth: approvedThisMonth[0]?.total || 0,
      approvedCount: approvedThisMonth[0]?.count || 0,
      taxDeductibleTotal: taxDeductible[0]?.total || 0
    };

  } catch (error) {
    console.error('Error calculating expense stats:', error);
    return {};
  }
}

module.exports = expenseController;





























































// const { Expense, Budget, ExpenseVendor } = require("../Models/ExpenseModels");
// const Property = require("../Models/PropertyModel");
// const mongoose = require("mongoose");

// const expenseController = {
//   // ========== EXPENSE METHODS ==========

//   // Create new expense
//   // createExpense: async (req, res) => {
//   //   try {
//   //     const {
//   //       date,
//   //       category,
//   //       description,
//   //       amount,
//   //       propertyId,
//   //       unit,
//   //       paidTo,
//   //       paymentMethod,
//   //       recurring,
//   //       recurrence,
//   //       tags,
//   //       notes,
//   //       budgetCategory,
//   //       taxDeductible
//   //     } = req.body;

//   //     console.log('Creating expense:', req.body);

//   //     // Validate required fields
//   //     if (!category || !description || !amount || !propertyId || !paidTo || !paymentMethod) {
//   //       return res.status(400).json({
//   //         success: false,
//   //         message: "Category, description, amount, property, paidTo, and paymentMethod are required"
//   //       });
//   //     }

//   //     // Check if property exists
//   //     const property = await Property.findById(propertyId);
//   //     if (!property) {
//   //       return res.status(404).json({
//   //         success: false,
//   //         message: "Property not found"
//   //       });
//   //     }

//   //     // Handle receipt upload if any
//   //     let receiptUrl = '';
//   //     let receiptFileId = '';
      
//   //     if (req.file) {
//   //       // If using Cloudinary
//   //       if (req.file.cloudinary) {
//   //         receiptUrl = req.file.cloudinary.url;
//   //         receiptFileId = req.file.cloudinary.public_id;
//   //       } else {
//   //         // Local file storage
//   //         receiptUrl = `/uploads/expenses/${req.file.filename}`;
//   //       }
//   //     }

//   //     const expense = new Expense({
//   //       date: date || new Date(),
//   //       category,
//   //       description,
//   //       amount: parseFloat(amount),
//   //       property: propertyId,
//   //       unit: unit || '',
//   //       paidTo,
//   //       paymentMethod,
//   //       receipt: receiptUrl,
//   //       receiptFileId,
//   //       recurring: recurring || false,
//   //       recurrence: recurring ? recurrence : undefined,
//   //       tags: tags || [],
//   //       notes: notes || '',
//   //       budgetCategory: budgetCategory || '',
//   //       taxDeductible: taxDeductible !== undefined ? taxDeductible : true,
//   //       createdBy: req.user.id
//   //     });

//   //     // If recurring, calculate next recurrence date
//   //     if (expense.recurring && expense.recurrence) {
//   //       const nextDate = new Date(expense.date);
//   //       switch (expense.recurrence) {
//   //         case 'weekly':
//   //           nextDate.setDate(nextDate.getDate() + 7);
//   //           break;
//   //         case 'monthly':
//   //           nextDate.setMonth(nextDate.getMonth() + 1);
//   //           break;
//   //         case 'quarterly':
//   //           nextDate.setMonth(nextDate.getMonth() + 3);
//   //           break;
//   //         case 'yearly':
//   //           nextDate.setFullYear(nextDate.getFullYear() + 1);
//   //           break;
//   //       }
//   //       expense.nextRecurrenceDate = nextDate;
//   //     }

//   //     await expense.save();

//   //     // Populate related fields
//   //     await expense.populate('property', 'title location');
//   //     await expense.populate('createdBy', 'firstName lastName');
//   //     if (expense.approvedBy) {
//   //       await expense.populate('approvedBy', 'firstName lastName');
//   //     }

//   //     // Update budget spent amount if budget category is specified
//   //     if (expense.budgetCategory && expense.status === 'approved') {
//   //       await updateBudgetSpent(expense.budgetCategory, expense.amount);
//   //     }

//   //     res.status(201).json({
//   //       success: true,
//   //       message: "Expense created successfully",
//   //       expense
//   //     });

//   //   } catch (error) {
//   //     console.error('Create expense error:', error);
//   //     res.status(500).json({
//   //       success: false,
//   //       message: "Failed to create expense",
//   //       error: error.message
//   //     });
//   //   }
//   // },




// // Create vendor
// createVendor: async (req, res) => {
//   try {
//     const {
//       name,
//       category,
//       contactPerson,
//       phone,
//       email,
//       address,
//       taxId,
//       paymentTerms,
//       preferred,
//       rating,
//       notes
//     } = req.body;

//     console.log('Creating vendor with data:', req.body);

//     // Validate required fields
//     if (!name || !category || !phone || !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, category, phone, and email are required"
//       });
//     }

//     // Check if vendor already exists
//     const existingVendor = await ExpenseVendor.findOne({
//       $or: [
//         { email: email.toLowerCase() },
//         { name: { $regex: new RegExp(`^${name}$`, 'i') } }
//       ]
//     });

//     if (existingVendor) {
//       return res.status(400).json({
//         success: false,
//         message: "Vendor with this name or email already exists"
//       });
//     }

//     // Create vendor WITHOUT setting vendorNumber - let the pre-save hook handle it
//     const vendorData = {
//       name,
//       category,
//       contactPerson: contactPerson || {},
//       phone,
//       email: email.toLowerCase(),
//       address: address || {},
//       taxId: taxId || '',
//       paymentTerms: paymentTerms || 'net30',
//       preferred: preferred || false,
//       rating: rating || 3,
//       notes: notes || '',
//       createdBy: req.user.id
//     };

//     console.log('Vendor data before save:', vendorData);

//     const vendor = new ExpenseVendor(vendorData);
//     await vendor.save();
    
//     console.log('Vendor saved successfully:', vendor);

//     await vendor.populate('createdBy', 'firstName lastName');

//     res.status(201).json({
//       success: true,
//       message: "Vendor created successfully",
//       vendor
//     });

//   } catch (error) {
//     console.error('Create vendor error:', error);
    
//     // Check for validation errors
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => ({
//         field: err.path,
//         message: err.message
//       }));
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: "Failed to create vendor",
//       error: error.message
//     });
//   }
// },






//   // Get all expenses
//   getAllExpenses: async (req, res) => {
//     try {
//       const {
//         page = 1,
//         limit = 50,
//         category,
//         status,
//         propertyId,
//         startDate,
//         endDate,
//         search,
//         sortBy = 'date',
//         sortOrder = 'desc'
//       } = req.query;

//       const query = {};

//       // Apply filters
//       if (category && category !== 'all') query.category = category;
//       if (status && status !== 'all') query.status = status;
//       if (propertyId && propertyId !== 'all') query.property = propertyId;

//       // Date range filter
//       if (startDate || endDate) {
//         query.date = {};
//         if (startDate) query.date.$gte = new Date(startDate);
//         if (endDate) query.date.$lte = new Date(endDate);
//       }

//       // Search in description, paidTo, notes
//       if (search) {
//         query.$or = [
//           { description: { $regex: search, $options: 'i' } },
//           { paidTo: { $regex: search, $options: 'i' } },
//           { notes: { $regex: search, $options: 'i' } },
//           { expenseNumber: { $regex: search, $options: 'i' } }
//         ];
//       }

//       const sort = {};
//       sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//       const expenses = await Expense.find(query)
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName')
//         .sort(sort)
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await Expense.countDocuments(query);

//       // Calculate statistics
//       const stats = await calculateExpenseStats(query);

//       res.status(200).json({
//         success: true,
//         expenses,
//         stats,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get expenses error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch expenses",
//         error: error.message
//       });
//     }
//   },

//   // Get expense by ID
//   getExpenseById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const expense = await Expense.findById(id)
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName');

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         expense
//       });

//     } catch (error) {
//       console.error('Get expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch expense",
//         error: error.message
//       });
//     }
//   },

//   // Update expense
//   updateExpense: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const expense = await Expense.findById(id);

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       // Handle receipt upload if any
//       if (req.file) {
//         if (req.file.cloudinary) {
//           updateData.receipt = req.file.cloudinary.url;
//           updateData.receiptFileId = req.file.cloudinary.public_id;
//         } else {
//           updateData.receipt = `/uploads/expenses/${req.file.filename}`;
//         }
//       }

//       // If amount changed and expense is approved, update budget
//       const oldAmount = expense.amount;
//       const newAmount = updateData.amount !== undefined ? parseFloat(updateData.amount) : oldAmount;

//       const updatedExpense = await Expense.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       )
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName');

//       // Update budget if amount changed and expense is approved
//       if (updatedExpense.budgetCategory && updatedExpense.status === 'approved') {
//         if (oldAmount !== newAmount) {
//           await updateBudgetSpent(updatedExpense.budgetCategory, newAmount - oldAmount);
//         }
//       }

//       res.status(200).json({
//         success: true,
//         message: "Expense updated successfully",
//         expense: updatedExpense
//       });

//     } catch (error) {
//       console.error('Update expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update expense",
//         error: error.message
//       });
//     }
//   },

//   // Delete expense
//   deleteExpense: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const expense = await Expense.findById(id);

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       // Update budget if expense was approved
//       if (expense.budgetCategory && expense.status === 'approved') {
//         await updateBudgetSpent(expense.budgetCategory, -expense.amount);
//       }

//       await Expense.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Expense deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete expense",
//         error: error.message
//       });
//     }
//   },

//   // Update expense status
//   updateExpenseStatus: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status, notes } = req.body;

//       const expense = await Expense.findById(id);

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       const oldStatus = expense.status;

//       expense.status = status;
//       if (status === 'approved') {
//         expense.approvedBy = req.user.id;
//         expense.approvedAt = new Date();
//       } else if (status === 'paid') {
//         expense.paidAt = new Date();
//       }
//       if (notes) expense.notes = notes;

//       await expense.save();

//       // Update budget if status changed to approved
//       if (oldStatus !== 'approved' && status === 'approved' && expense.budgetCategory) {
//         await updateBudgetSpent(expense.budgetCategory, expense.amount);
//       }

//       // Update budget if status changed from approved to something else
//       if (oldStatus === 'approved' && status !== 'approved' && expense.budgetCategory) {
//         await updateBudgetSpent(expense.budgetCategory, -expense.amount);
//       }

//       await expense.populate('approvedBy', 'firstName lastName');

//       res.status(200).json({
//         success: true,
//         message: "Expense status updated successfully",
//         expense
//       });

//     } catch (error) {
//       console.error('Update expense status error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update expense status",
//         error: error.message
//       });
//     }
//   },

//   // ========== BUDGET METHODS ==========

//   // Create budget
//   createBudget: async (req, res) => {
//     try {
//       const {
//         category,
//         allocated,
//         period,
//         fiscalYear,
//         startDate,
//         endDate,
//         notes
//       } = req.body;

//       // Check if budget already exists for this category and period
//       const existingBudget = await Budget.findOne({
//         category,
//         period,
//         fiscalYear
//       });

//       if (existingBudget) {
//         return res.status(400).json({
//           success: false,
//           message: `Budget for ${category} (${period} ${fiscalYear}) already exists`
//         });
//       }

//       const budget = new Budget({
//         category,
//         allocated: parseFloat(allocated),
//         period,
//         fiscalYear: parseInt(fiscalYear),
//         startDate: startDate || new Date(fiscalYear, 0, 1),
//         endDate: endDate || new Date(fiscalYear, 11, 31),
//         notes: notes || '',
//         createdBy: req.user.id
//       });

//       await budget.save();
//       await budget.populate('createdBy', 'firstName lastName');

//       res.status(201).json({
//         success: true,
//         message: "Budget created successfully",
//         budget
//       });

//     } catch (error) {
//       console.error('Create budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create budget",
//         error: error.message
//       });
//     }
//   },

//   // Get all budgets
//   getAllBudgets: async (req, res) => {
//     try {
//       const {
//         period,
//         fiscalYear,
//         isActive
//       } = req.query;

//       const query = {};

//       if (period && period !== 'all') query.period = period;
//       if (fiscalYear) query.fiscalYear = parseInt(fiscalYear);
//       if (isActive !== undefined) query.isActive = isActive === 'true';

//       const budgets = await Budget.find(query)
//         .populate('createdBy', 'firstName lastName')
//         .populate('updatedBy', 'firstName lastName')
//         .sort({ category: 1 });

//       res.status(200).json({
//         success: true,
//         budgets
//       });

//     } catch (error) {
//       console.error('Get budgets error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch budgets",
//         error: error.message
//       });
//     }
//   },

//   // Get budget by ID
//   getBudgetById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const budget = await Budget.findById(id)
//         .populate('createdBy', 'firstName lastName')
//         .populate('updatedBy', 'firstName lastName');

//       if (!budget) {
//         return res.status(404).json({
//           success: false,
//           message: "Budget not found"
//         });
//       }

//       // Get expenses for this budget
//       const expenses = await Expense.find({
//         budgetCategory: budget.category,
//         status: { $in: ['approved', 'paid'] },
//         date: { $gte: budget.startDate, $lte: budget.endDate }
//       })
//         .populate('property', 'title')
//         .sort({ date: -1 });

//       res.status(200).json({
//         success: true,
//         budget,
//         expenses
//       });

//     } catch (error) {
//       console.error('Get budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch budget",
//         error: error.message
//       });
//     }
//   },

//   // Update budget
//   updateBudget: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       updateData.updatedBy = req.user.id;

//       const budget = await Budget.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       )
//         .populate('createdBy', 'firstName lastName')
//         .populate('updatedBy', 'firstName lastName');

//       if (!budget) {
//         return res.status(404).json({
//           success: false,
//           message: "Budget not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Budget updated successfully",
//         budget
//       });

//     } catch (error) {
//       console.error('Update budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update budget",
//         error: error.message
//       });
//     }
//   },

//   // Delete budget
//   deleteBudget: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const budget = await Budget.findById(id);

//       if (!budget) {
//         return res.status(404).json({
//           success: false,
//           message: "Budget not found"
//         });
//       }

//       // Check if there are expenses using this budget
//       const expensesUsingBudget = await Expense.countDocuments({
//         budgetCategory: budget.category,
//         status: 'approved'
//       });

//       if (expensesUsingBudget > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot delete budget. ${expensesUsingBudget} approved expenses are using this budget.`
//         });
//       }

//       await Budget.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Budget deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete budget",
//         error: error.message
//       });
//     }
//   },

//   // ========== VENDOR METHODS ==========

//   // Create vendor
//   createVendor: async (req, res) => {
//     try {
//       const {
//         name,
//         category,
//         contactPerson,
//         phone,
//         email,
//         address,
//         taxId,
//         paymentTerms,
//         preferred,
//         rating,
//         notes
//       } = req.body;

//       // Check if vendor already exists
//       const existingVendor = await ExpenseVendor.findOne({
//         $or: [
//           { email: email.toLowerCase() },
//           { name: { $regex: new RegExp(`^${name}$`, 'i') } }
//         ]
//       });

//       if (existingVendor) {
//         return res.status(400).json({
//           success: false,
//           message: "Vendor with this name or email already exists"
//         });
//       }

//       const vendor = new ExpenseVendor({
//         name,
//         category,
//         contactPerson: contactPerson || {},
//         phone,
//         email: email.toLowerCase(),
//         address: address || {},
//         taxId: taxId || '',
//         paymentTerms: paymentTerms || 'net30',
//         preferred: preferred || false,
//         rating: rating || 3,
//         notes: notes || '',
//         createdBy: req.user.id
//       });

//       await vendor.save();
//       await vendor.populate('createdBy', 'firstName lastName');

//       res.status(201).json({
//         success: true,
//         message: "Vendor created successfully",
//         vendor
//       });

//     } catch (error) {
//       console.error('Create vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create vendor",
//         error: error.message
//       });
//     }
//   },

//   // Get all vendors
//   getAllVendors: async (req, res) => {
//     try {
//       const {
//         category,
//         preferred,
//         search,
//         page = 1,
//         limit = 50
//       } = req.query;

//       const query = { isActive: true };

//       if (category && category !== 'all') query.category = category;
//       if (preferred !== undefined) query.preferred = preferred === 'true';

//       if (search) {
//         query.$or = [
//           { name: { $regex: search, $options: 'i' } },
//           { email: { $regex: search, $options: 'i' } },
//           { 'contactPerson.name': { $regex: search, $options: 'i' } }
//         ];
//       }

//       const vendors = await ExpenseVendor.find(query)
//         .populate('createdBy', 'firstName lastName')
//         .sort({ preferred: -1, name: 1 })
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await ExpenseVendor.countDocuments(query);

//       res.status(200).json({
//         success: true,
//         vendors,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get vendors error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch vendors",
//         error: error.message
//       });
//     }
//   },

//   // Get vendor by ID
//   getVendorById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const vendor = await ExpenseVendor.findById(id)
//         .populate('createdBy', 'firstName lastName');

//       if (!vendor) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor not found"
//         });
//       }

//       // Get recent expenses from this vendor
//       const recentExpenses = await Expense.find({
//         paidTo: { $regex: new RegExp(vendor.name, 'i') }
//       })
//         .populate('property', 'title')
//         .sort({ date: -1 })
//         .limit(10);

//       res.status(200).json({
//         success: true,
//         vendor,
//         recentExpenses
//       });

//     } catch (error) {
//       console.error('Get vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch vendor",
//         error: error.message
//       });
//     }
//   },

//   // Update vendor
//   updateVendor: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const vendor = await ExpenseVendor.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       ).populate('createdBy', 'firstName lastName');

//       if (!vendor) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Vendor updated successfully",
//         vendor
//       });

//     } catch (error) {
//       console.error('Update vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update vendor",
//         error: error.message
//       });
//     }
//   },

//   // Delete vendor (soft delete)
//   deleteVendor: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const vendor = await ExpenseVendor.findById(id);

//       if (!vendor) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor not found"
//         });
//       }

//       // Check if vendor has expenses
//       const expensesUsingVendor = await Expense.countDocuments({
//         paidTo: { $regex: new RegExp(vendor.name, 'i') }
//       });

//       if (expensesUsingVendor > 0) {
//         // Soft delete instead
//         vendor.isActive = false;
//         await vendor.save();
        
//         return res.status(200).json({
//           success: true,
//           message: "Vendor deactivated successfully (has existing expenses)"
//         });
//       }

//       await ExpenseVendor.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Vendor deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete vendor",
//         error: error.message
//       });
//     }
//   },

//   // ========== REPORT METHODS ==========

//   // Get expense statistics
//   getExpenseStats: async (req, res) => {
//     try {
//       const { period = 'month', year = new Date().getFullYear() } = req.query;

//       let startDate, endDate;

//       switch (period) {
//         case 'month':
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//           break;
//         case 'quarter':
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//           break;
//         case 'year':
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//           break;
//         default:
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//       }

//       const matchStage = {
//         date: { $gte: startDate, $lte: endDate }
//       };

//       // Monthly breakdown
//       const monthlyStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: { $month: '$date' },
//             total: { $sum: '$amount' },
//             count: { $sum: 1 },
//             approved: {
//               $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
//             },
//             paid: {
//               $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
//             }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]);

//       // Category breakdown
//       const categoryStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: '$category',
//             total: { $sum: '$amount' },
//             count: { $sum: 1 }
//           }
//         },
//         { $sort: { total: -1 } }
//       ]);

//       // Property breakdown
//       const propertyStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: '$property',
//             total: { $sum: '$amount' },
//             count: { $sum: 1 }
//           }
//         },
//         { $sort: { total: -1 } },
//         { $limit: 10 }
//       ]);

//       await Expense.populate(propertyStats, { path: '_id', select: 'title' });

//       // Status breakdown
//       const statusStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: '$status',
//             total: { $sum: '$amount' },
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       // Tax deductible total
//       const taxDeductibleTotal = await Expense.aggregate([
//         {
//           $match: {
//             ...matchStage,
//             taxDeductible: true,
//             status: { $in: ['approved', 'paid'] }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: '$amount' }
//           }
//         }
//       ]);

//       // Budget vs actual
//       const budgetVsActual = await Budget.aggregate([
//         { $match: { fiscalYear: parseInt(year), isActive: true } },
//         {
//           $lookup: {
//             from: 'expenses',
//             let: { category: '$category', start: '$startDate', end: '$endDate' },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ['$budgetCategory', '$$category'] },
//                       { $gte: ['$date', '$$start'] },
//                       { $lte: ['$date', '$$end'] },
//                       { $in: ['$status', ['approved', 'paid']] }
//                     ]
//                   }
//                 }
//               },
//               {
//                 $group: {
//                   _id: null,
//                   actual: { $sum: '$amount' }
//                 }
//               }
//             ],
//             as: 'expenses'
//           }
//         },
//         {
//           $addFields: {
//             actual: { $ifNull: [{ $arrayElemAt: ['$expenses.actual', 0] }, 0] },
//             variance: { $subtract: ['$allocated', { $ifNull: [{ $arrayElemAt: ['$expenses.actual', 0] }, 0] }] }
//           }
//         },
//         { $project: { expenses: 0 } }
//       ]);

//       res.status(200).json({
//         success: true,
//         stats: {
//           monthly: monthlyStats,
//           byCategory: categoryStats,
//           byProperty: propertyStats,
//           byStatus: statusStats,
//           taxDeductible: taxDeductibleTotal[0]?.total || 0,
//           budgetVsActual
//         }
//       });

//     } catch (error) {
//       console.error('Get expense stats error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch expense statistics",
//         error: error.message
//       });
//     }
//   },

//   // Export expenses to CSV
//   exportExpenses: async (req, res) => {
//     try {
//       const {
//         startDate,
//         endDate,
//         category,
//         status,
//         propertyId
//       } = req.query;

//       const query = {};

//       if (category && category !== 'all') query.category = category;
//       if (status && status !== 'all') query.status = status;
//       if (propertyId && propertyId !== 'all') query.property = propertyId;
      
//       if (startDate || endDate) {
//         query.date = {};
//         if (startDate) query.date.$gte = new Date(startDate);
//         if (endDate) query.date.$lte = new Date(endDate);
//       }

//       const expenses = await Expense.find(query)
//         .populate('property', 'title')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName')
//         .sort({ date: -1 });

//       // Generate CSV
//       const csvRows = [];
//       csvRows.push('Expense Number,Date,Category,Description,Amount,Property,Unit,Paid To,Payment Method,Status,Tax Deductible,Tags,Notes');

//       for (const expense of expenses) {
//         csvRows.push([
//           expense.expenseNumber,
//           new Date(expense.date).toISOString().split('T')[0],
//           expense.category,
//           `"${expense.description.replace(/"/g, '""')}"`,
//           expense.amount,
//           expense.property?.title || 'Unknown',
//           expense.unit || '',
//           `"${expense.paidTo.replace(/"/g, '""')}"`,
//           expense.paymentMethod,
//           expense.status,
//           expense.taxDeductible ? 'Yes' : 'No',
//           expense.tags.join('; '),
//           `"${(expense.notes || '').replace(/"/g, '""')}"`
//         ].join(','));
//       }

//       const csv = csvRows.join('\n');

//       res.setHeader('Content-Type', 'text/csv');
//       res.setHeader('Content-Disposition', `attachment; filename=expenses-${new Date().toISOString().split('T')[0]}.csv`);
//       res.status(200).send(csv);

//     } catch (error) {
//       console.error('Export expenses error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to export expenses",
//         error: error.message
//       });
//     }
//   },

//   // Process recurring expenses (to be called by cron job)
//   processRecurringExpenses: async (req, res) => {
//     try {
//       const today = new Date();
      
//       const recurringExpenses = await Expense.find({
//         recurring: true,
//         nextRecurrenceDate: { $lte: today },
//         status: { $in: ['approved', 'paid'] }
//       });

//       const created = [];

//       for (const expense of recurringExpenses) {
//         // Create new expense based on recurring template
//         const newExpense = new Expense({
//           ...expense.toObject(),
//           _id: new mongoose.Types.ObjectId(),
//           expenseNumber: undefined, // Will be generated
//           date: today,
//           status: 'pending',
//           approvedBy: undefined,
//           approvedAt: undefined,
//           paidAt: undefined,
//           recurring: true,
//           nextRecurrenceDate: undefined,
//           createdBy: expense.createdBy
//         });

//         // Calculate next recurrence date
//         const nextDate = new Date(today);
//         switch (expense.recurrence) {
//           case 'weekly':
//             nextDate.setDate(nextDate.getDate() + 7);
//             break;
//           case 'monthly':
//             nextDate.setMonth(nextDate.getMonth() + 1);
//             break;
//           case 'quarterly':
//             nextDate.setMonth(nextDate.getMonth() + 3);
//             break;
//           case 'yearly':
//             nextDate.setFullYear(nextDate.getFullYear() + 1);
//             break;
//         }
        
//         // Update original expense's next recurrence date
//         expense.nextRecurrenceDate = nextDate;
//         await expense.save();

//         // Save new expense
//         await newExpense.save();
//         created.push(newExpense);
//       }

//       res.status(200).json({
//         success: true,
//         message: `Processed ${created.length} recurring expenses`,
//         created
//       });

//     } catch (error) {
//       console.error('Process recurring expenses error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to process recurring expenses",
//         error: error.message
//       });
//     }
//   }
// };

// // Helper function to update budget spent amount
// async function updateBudgetSpent(budgetCategory, amountChange) {
//   try {
//     const budget = await Budget.findOne({ category: budgetCategory });
//     if (budget) {
//       budget.spent = (budget.spent || 0) + amountChange;
//       await budget.save();
//     }
//   } catch (error) {
//     console.error('Error updating budget spent:', error);
//   }
// }

// // Helper function to calculate expense statistics
// async function calculateExpenseStats(query) {
//   try {
//     const currentMonth = new Date();
//     currentMonth.setDate(1);
//     currentMonth.setHours(0, 0, 0, 0);
    
//     const nextMonth = new Date(currentMonth);
//     nextMonth.setMonth(nextMonth.getMonth() + 1);

//     const monthQuery = { ...query, date: { $gte: currentMonth, $lt: nextMonth } };

//     const [
//       monthlyExpenses,
//       pendingApproval,
//       approvedThisMonth,
//       taxDeductible
//     ] = await Promise.all([
//       Expense.aggregate([
//         { $match: monthQuery },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
//       ]),
//       Expense.aggregate([
//         { $match: { ...query, status: 'pending' } },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
//       ]),
//       Expense.aggregate([
//         { $match: { ...monthQuery, status: 'approved' } },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
//       ]),
//       Expense.aggregate([
//         { $match: { ...query, taxDeductible: true, status: { $in: ['approved', 'paid'] } } },
//         { $group: { _id: null, total: { $sum: '$amount' } } }
//       ])
//     ]);

//     return {
//       monthlyTotal: monthlyExpenses[0]?.total || 0,
//       monthlyCount: monthlyExpenses[0]?.count || 0,
//       pendingTotal: pendingApproval[0]?.total || 0,
//       pendingCount: pendingApproval[0]?.count || 0,
//       approvedThisMonth: approvedThisMonth[0]?.total || 0,
//       approvedCount: approvedThisMonth[0]?.count || 0,
//       taxDeductibleTotal: taxDeductible[0]?.total || 0
//     };

//   } catch (error) {
//     console.error('Error calculating expense stats:', error);
//     return {};
//   }
// }

// module.exports = expenseController;



























































// const { Expense, Budget, Vendor } = require("../Models/ExpenseModels");
// const { Expense, Budget, ExpenseVendor } = require("../Models/ExpenseModels");
// const Property = require("../Models/PropertyModel");
// const mongoose = require("mongoose");

// const expenseController = {
//   // ========== EXPENSE METHODS ==========

//   // Create new expense
//   createExpense: async (req, res) => {
//     try {
//       const {
//         date,
//         category,
//         description,
//         amount,
//         propertyId,
//         unit,
//         paidTo,
//         paymentMethod,
//         recurring,
//         recurrence,
//         tags,
//         notes,
//         budgetCategory,
//         taxDeductible
//       } = req.body;

//       console.log('Creating expense:', req.body);

//       // Validate required fields
//       if (!category || !description || !amount || !propertyId || !paidTo || !paymentMethod) {
//         return res.status(400).json({
//           success: false,
//           message: "Category, description, amount, property, paidTo, and paymentMethod are required"
//         });
//       }

//       // Check if property exists
//       const property = await Property.findById(propertyId);
//       if (!property) {
//         return res.status(404).json({
//           success: false,
//           message: "Property not found"
//         });
//       }

//       // Handle receipt upload if any
//       let receiptUrl = '';
//       let receiptFileId = '';
      
//       if (req.file) {
//         // If using Cloudinary
//         if (req.file.cloudinary) {
//           receiptUrl = req.file.cloudinary.url;
//           receiptFileId = req.file.cloudinary.public_id;
//         } else {
//           // Local file storage
//           receiptUrl = `/uploads/expenses/${req.file.filename}`;
//         }
//       }

//       const expense = new Expense({
//         date: date || new Date(),
//         category,
//         description,
//         amount: parseFloat(amount),
//         property: propertyId,
//         unit: unit || '',
//         paidTo,
//         paymentMethod,
//         receipt: receiptUrl,
//         receiptFileId,
//         recurring: recurring || false,
//         recurrence: recurring ? recurrence : undefined,
//         tags: tags || [],
//         notes: notes || '',
//         budgetCategory: budgetCategory || '',
//         taxDeductible: taxDeductible !== undefined ? taxDeductible : true,
//         createdBy: req.user.id
//       });

//       // If recurring, calculate next recurrence date
//       if (expense.recurring && expense.recurrence) {
//         const nextDate = new Date(expense.date);
//         switch (expense.recurrence) {
//           case 'weekly':
//             nextDate.setDate(nextDate.getDate() + 7);
//             break;
//           case 'monthly':
//             nextDate.setMonth(nextDate.getMonth() + 1);
//             break;
//           case 'quarterly':
//             nextDate.setMonth(nextDate.getMonth() + 3);
//             break;
//           case 'yearly':
//             nextDate.setFullYear(nextDate.getFullYear() + 1);
//             break;
//         }
//         expense.nextRecurrenceDate = nextDate;
//       }

//       await expense.save();

//       // Populate related fields
//       await expense.populate('property', 'title location');
//       await expense.populate('createdBy', 'firstName lastName');
//       if (expense.approvedBy) {
//         await expense.populate('approvedBy', 'firstName lastName');
//       }

//       // Update budget spent amount if budget category is specified
//       if (expense.budgetCategory && expense.status === 'approved') {
//         await updateBudgetSpent(expense.budgetCategory, expense.amount);
//       }

//       res.status(201).json({
//         success: true,
//         message: "Expense created successfully",
//         expense
//       });

//     } catch (error) {
//       console.error('Create expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create expense",
//         error: error.message
//       });
//     }
//   },

//   // Get all expenses
//   getAllExpenses: async (req, res) => {
//     try {
//       const {
//         page = 1,
//         limit = 50,
//         category,
//         status,
//         propertyId,
//         startDate,
//         endDate,
//         search,
//         sortBy = 'date',
//         sortOrder = 'desc'
//       } = req.query;

//       const query = {};

//       // Apply filters
//       if (category && category !== 'all') query.category = category;
//       if (status && status !== 'all') query.status = status;
//       if (propertyId && propertyId !== 'all') query.property = propertyId;

//       // Date range filter
//       if (startDate || endDate) {
//         query.date = {};
//         if (startDate) query.date.$gte = new Date(startDate);
//         if (endDate) query.date.$lte = new Date(endDate);
//       }

//       // Search in description, paidTo, notes
//       if (search) {
//         query.$or = [
//           { description: { $regex: search, $options: 'i' } },
//           { paidTo: { $regex: search, $options: 'i' } },
//           { notes: { $regex: search, $options: 'i' } },
//           { expenseNumber: { $regex: search, $options: 'i' } }
//         ];
//       }

//       const sort = {};
//       sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//       const expenses = await Expense.find(query)
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName')
//         .sort(sort)
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await Expense.countDocuments(query);

//       // Calculate statistics
//       const stats = await calculateExpenseStats(query);

//       res.status(200).json({
//         success: true,
//         expenses,
//         stats,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get expenses error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch expenses",
//         error: error.message
//       });
//     }
//   },

//   // Get expense by ID
//   getExpenseById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const expense = await Expense.findById(id)
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName');

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         expense
//       });

//     } catch (error) {
//       console.error('Get expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch expense",
//         error: error.message
//       });
//     }
//   },

//   // Update expense
//   updateExpense: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const expense = await Expense.findById(id);

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       // Handle receipt upload if any
//       if (req.file) {
//         if (req.file.cloudinary) {
//           updateData.receipt = req.file.cloudinary.url;
//           updateData.receiptFileId = req.file.cloudinary.public_id;
//         } else {
//           updateData.receipt = `/uploads/expenses/${req.file.filename}`;
//         }
//       }

//       // If amount changed and expense is approved, update budget
//       const oldAmount = expense.amount;
//       const newAmount = updateData.amount !== undefined ? parseFloat(updateData.amount) : oldAmount;

//       const updatedExpense = await Expense.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       )
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName');

//       // Update budget if amount changed and expense is approved
//       if (updatedExpense.budgetCategory && updatedExpense.status === 'approved') {
//         if (oldAmount !== newAmount) {
//           await updateBudgetSpent(updatedExpense.budgetCategory, newAmount - oldAmount);
//         }
//       }

//       res.status(200).json({
//         success: true,
//         message: "Expense updated successfully",
//         expense: updatedExpense
//       });

//     } catch (error) {
//       console.error('Update expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update expense",
//         error: error.message
//       });
//     }
//   },

//   // Delete expense
//   deleteExpense: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const expense = await Expense.findById(id);

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       // Update budget if expense was approved
//       if (expense.budgetCategory && expense.status === 'approved') {
//         await updateBudgetSpent(expense.budgetCategory, -expense.amount);
//       }

//       await Expense.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Expense deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete expense error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete expense",
//         error: error.message
//       });
//     }
//   },

//   // Update expense status
//   updateExpenseStatus: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { status, notes } = req.body;

//       const expense = await Expense.findById(id);

//       if (!expense) {
//         return res.status(404).json({
//           success: false,
//           message: "Expense not found"
//         });
//       }

//       const oldStatus = expense.status;

//       expense.status = status;
//       if (status === 'approved') {
//         expense.approvedBy = req.user.id;
//         expense.approvedAt = new Date();
//       } else if (status === 'paid') {
//         expense.paidAt = new Date();
//       }
//       if (notes) expense.notes = notes;

//       await expense.save();

//       // Update budget if status changed to approved
//       if (oldStatus !== 'approved' && status === 'approved' && expense.budgetCategory) {
//         await updateBudgetSpent(expense.budgetCategory, expense.amount);
//       }

//       // Update budget if status changed from approved to something else
//       if (oldStatus === 'approved' && status !== 'approved' && expense.budgetCategory) {
//         await updateBudgetSpent(expense.budgetCategory, -expense.amount);
//       }

//       await expense.populate('approvedBy', 'firstName lastName');

//       res.status(200).json({
//         success: true,
//         message: "Expense status updated successfully",
//         expense
//       });

//     } catch (error) {
//       console.error('Update expense status error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update expense status",
//         error: error.message
//       });
//     }
//   },

//   // ========== BUDGET METHODS ==========

//   // Create budget
//   createBudget: async (req, res) => {
//     try {
//       const {
//         category,
//         allocated,
//         period,
//         fiscalYear,
//         startDate,
//         endDate,
//         notes
//       } = req.body;

//       // Check if budget already exists for this category and period
//       const existingBudget = await Budget.findOne({
//         category,
//         period,
//         fiscalYear
//       });

//       if (existingBudget) {
//         return res.status(400).json({
//           success: false,
//           message: `Budget for ${category} (${period} ${fiscalYear}) already exists`
//         });
//       }

//       const budget = new Budget({
//         category,
//         allocated: parseFloat(allocated),
//         period,
//         fiscalYear: parseInt(fiscalYear),
//         startDate: startDate || new Date(fiscalYear, 0, 1),
//         endDate: endDate || new Date(fiscalYear, 11, 31),
//         notes: notes || '',
//         createdBy: req.user.id
//       });

//       await budget.save();
//       await budget.populate('createdBy', 'firstName lastName');

//       res.status(201).json({
//         success: true,
//         message: "Budget created successfully",
//         budget
//       });

//     } catch (error) {
//       console.error('Create budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create budget",
//         error: error.message
//       });
//     }
//   },

//   // Get all budgets
//   getAllBudgets: async (req, res) => {
//     try {
//       const {
//         period,
//         fiscalYear,
//         isActive
//       } = req.query;

//       const query = {};

//       if (period && period !== 'all') query.period = period;
//       if (fiscalYear) query.fiscalYear = parseInt(fiscalYear);
//       if (isActive !== undefined) query.isActive = isActive === 'true';

//       const budgets = await Budget.find(query)
//         .populate('createdBy', 'firstName lastName')
//         .populate('updatedBy', 'firstName lastName')
//         .sort({ category: 1 });

//       res.status(200).json({
//         success: true,
//         budgets
//       });

//     } catch (error) {
//       console.error('Get budgets error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch budgets",
//         error: error.message
//       });
//     }
//   },

//   // Get budget by ID
//   getBudgetById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const budget = await Budget.findById(id)
//         .populate('createdBy', 'firstName lastName')
//         .populate('updatedBy', 'firstName lastName');

//       if (!budget) {
//         return res.status(404).json({
//           success: false,
//           message: "Budget not found"
//         });
//       }

//       // Get expenses for this budget
//       const expenses = await Expense.find({
//         budgetCategory: budget.category,
//         status: { $in: ['approved', 'paid'] },
//         date: { $gte: budget.startDate, $lte: budget.endDate }
//       })
//         .populate('property', 'title')
//         .sort({ date: -1 });

//       res.status(200).json({
//         success: true,
//         budget,
//         expenses
//       });

//     } catch (error) {
//       console.error('Get budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch budget",
//         error: error.message
//       });
//     }
//   },

//   // Update budget
//   updateBudget: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       updateData.updatedBy = req.user.id;

//       const budget = await Budget.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       )
//         .populate('createdBy', 'firstName lastName')
//         .populate('updatedBy', 'firstName lastName');

//       if (!budget) {
//         return res.status(404).json({
//           success: false,
//           message: "Budget not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Budget updated successfully",
//         budget
//       });

//     } catch (error) {
//       console.error('Update budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update budget",
//         error: error.message
//       });
//     }
//   },

//   // Delete budget
//   deleteBudget: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const budget = await Budget.findById(id);

//       if (!budget) {
//         return res.status(404).json({
//           success: false,
//           message: "Budget not found"
//         });
//       }

//       // Check if there are expenses using this budget
//       const expensesUsingBudget = await Expense.countDocuments({
//         budgetCategory: budget.category,
//         status: 'approved'
//       });

//       if (expensesUsingBudget > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot delete budget. ${expensesUsingBudget} approved expenses are using this budget.`
//         });
//       }

//       await Budget.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Budget deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete budget error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete budget",
//         error: error.message
//       });
//     }
//   },

//   // ========== VENDOR METHODS ==========

//   // Create vendor
//   createVendor: async (req, res) => {
//     try {
//       const {
//         name,
//         category,
//         contactPerson,
//         phone,
//         email,
//         address,
//         taxId,
//         paymentTerms,
//         preferred,
//         rating,
//         notes
//       } = req.body;

//       // Check if vendor already exists
//       const existingVendor = await ExpenseVendor.findOne({
//         $or: [
//           { email: email.toLowerCase() },
//           { name: { $regex: new RegExp(`^${name}$`, 'i') } }
//         ]
//       });

//       if (existingVendor) {
//         return res.status(400).json({
//           success: false,
//           message: "Vendor with this name or email already exists"
//         });
//       }

//       const vendor = new ExpenseVendor({
//         name,
//         category,
//         contactPerson: contactPerson || {},
//         phone,
//         email: email.toLowerCase(),
//         address: address || {},
//         taxId: taxId || '',
//         paymentTerms: paymentTerms || 'net30',
//         preferred: preferred || false,
//         rating: rating || 3,
//         notes: notes || '',
//         createdBy: req.user.id
//       });

//       await vendor.save();
//       await vendor.populate('createdBy', 'firstName lastName');

//       res.status(201).json({
//         success: true,
//         message: "Vendor created successfully",
//         vendor
//       });

//     } catch (error) {
//       console.error('Create vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create vendor",
//         error: error.message
//       });
//     }
//   },

//   // Get all vendors
//   getAllVendors: async (req, res) => {
//     try {
//       const {
//         category,
//         preferred,
//         search,
//         page = 1,
//         limit = 50
//       } = req.query;

//       const query = { isActive: true };

//       if (category && category !== 'all') query.category = category;
//       if (preferred !== undefined) query.preferred = preferred === 'true';

//       if (search) {
//         query.$or = [
//           { name: { $regex: search, $options: 'i' } },
//           { email: { $regex: search, $options: 'i' } },
//           { 'contactPerson.name': { $regex: search, $options: 'i' } }
//         ];
//       }

//       const vendors = await ExpenseVendor.find(query)
//         .populate('createdBy', 'firstName lastName')
//         .sort({ preferred: -1, name: 1 })
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await ExpenseVendor.countDocuments(query);

//       res.status(200).json({
//         success: true,
//         vendors,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get vendors error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch vendors",
//         error: error.message
//       });
//     }
//   },

//   // Get vendor by ID
//   getVendorById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const vendor = await ExpenseVendor.findById(id)
//         .populate('createdBy', 'firstName lastName');

//       if (!vendor) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor not found"
//         });
//       }

//       // Get recent expenses from this vendor
//       const recentExpenses = await Expense.find({
//         paidTo: { $regex: new RegExp(vendor.name, 'i') }
//       })
//         .populate('property', 'title')
//         .sort({ date: -1 })
//         .limit(10);

//       res.status(200).json({
//         success: true,
//         vendor,
//         recentExpenses
//       });

//     } catch (error) {
//       console.error('Get vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch vendor",
//         error: error.message
//       });
//     }
//   },

//   // Update vendor
//   updateVendor: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const vendor = await ExpenseVendor.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       ).populate('createdBy', 'firstName lastName');

//       if (!vendor) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         message: "Vendor updated successfully",
//         vendor
//       });

//     } catch (error) {
//       console.error('Update vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update vendor",
//         error: error.message
//       });
//     }
//   },

//   // Delete vendor (soft delete)
//   deleteVendor: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const vendor = await ExpenseVendor.findById(id);

//       if (!vendor) {
//         return res.status(404).json({
//           success: false,
//           message: "Vendor not found"
//         });
//       }

//       // Check if vendor has expenses
//       const expensesUsingVendor = await Expense.countDocuments({
//         paidTo: { $regex: new RegExp(vendor.name, 'i') }
//       });

//       if (expensesUsingVendor > 0) {
//         // Soft delete instead
//         vendor.isActive = false;
//         await vendor.save();
        
//         return res.status(200).json({
//           success: true,
//           message: "Vendor deactivated successfully (has existing expenses)"
//         });
//       }

//       await ExpenseVendor.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Vendor deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete vendor error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete vendor",
//         error: error.message
//       });
//     }
//   },

//   // ========== REPORT METHODS ==========

//   // Get expense statistics
//   getExpenseStats: async (req, res) => {
//     try {
//       const { period = 'month', year = new Date().getFullYear() } = req.query;

//       let startDate, endDate;

//       switch (period) {
//         case 'month':
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//           break;
//         case 'quarter':
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//           break;
//         case 'year':
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//           break;
//         default:
//           startDate = new Date(year, 0, 1);
//           endDate = new Date(year, 11, 31);
//       }

//       const matchStage = {
//         date: { $gte: startDate, $lte: endDate }
//       };

//       // Monthly breakdown
//       const monthlyStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: { $month: '$date' },
//             total: { $sum: '$amount' },
//             count: { $sum: 1 },
//             approved: {
//               $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
//             },
//             paid: {
//               $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
//             }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]);

//       // Category breakdown
//       const categoryStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: '$category',
//             total: { $sum: '$amount' },
//             count: { $sum: 1 }
//           }
//         },
//         { $sort: { total: -1 } }
//       ]);

//       // Property breakdown
//       const propertyStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: '$property',
//             total: { $sum: '$amount' },
//             count: { $sum: 1 }
//           }
//         },
//         { $sort: { total: -1 } },
//         { $limit: 10 }
//       ]);

//       await Expense.populate(propertyStats, { path: '_id', select: 'title' });

//       // Status breakdown
//       const statusStats = await Expense.aggregate([
//         { $match: matchStage },
//         {
//           $group: {
//             _id: '$status',
//             total: { $sum: '$amount' },
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       // Tax deductible total
//       const taxDeductibleTotal = await Expense.aggregate([
//         {
//           $match: {
//             ...matchStage,
//             taxDeductible: true,
//             status: { $in: ['approved', 'paid'] }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: '$amount' }
//           }
//         }
//       ]);

//       // Budget vs actual
//       const budgetVsActual = await Budget.aggregate([
//         { $match: { fiscalYear: parseInt(year), isActive: true } },
//         {
//           $lookup: {
//             from: 'expenses',
//             let: { category: '$category', start: '$startDate', end: '$endDate' },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ['$budgetCategory', '$$category'] },
//                       { $gte: ['$date', '$$start'] },
//                       { $lte: ['$date', '$$end'] },
//                       { $in: ['$status', ['approved', 'paid']] }
//                     ]
//                   }
//                 }
//               },
//               {
//                 $group: {
//                   _id: null,
//                   actual: { $sum: '$amount' }
//                 }
//               }
//             ],
//             as: 'expenses'
//           }
//         },
//         {
//           $addFields: {
//             actual: { $ifNull: [{ $arrayElemAt: ['$expenses.actual', 0] }, 0] },
//             variance: { $subtract: ['$allocated', { $ifNull: [{ $arrayElemAt: ['$expenses.actual', 0] }, 0] }] }
//           }
//         },
//         { $project: { expenses: 0 } }
//       ]);

//       res.status(200).json({
//         success: true,
//         stats: {
//           monthly: monthlyStats,
//           byCategory: categoryStats,
//           byProperty: propertyStats,
//           byStatus: statusStats,
//           taxDeductible: taxDeductibleTotal[0]?.total || 0,
//           budgetVsActual
//         }
//       });

//     } catch (error) {
//       console.error('Get expense stats error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch expense statistics",
//         error: error.message
//       });
//     }
//   },

//   // Export expenses to CSV
//   exportExpenses: async (req, res) => {
//     try {
//       const {
//         startDate,
//         endDate,
//         category,
//         status,
//         propertyId
//       } = req.query;

//       const query = {};

//       if (category && category !== 'all') query.category = category;
//       if (status && status !== 'all') query.status = status;
//       if (propertyId && propertyId !== 'all') query.property = propertyId;
      
//       if (startDate || endDate) {
//         query.date = {};
//         if (startDate) query.date.$gte = new Date(startDate);
//         if (endDate) query.date.$lte = new Date(endDate);
//       }

//       const expenses = await Expense.find(query)
//         .populate('property', 'title')
//         .populate('createdBy', 'firstName lastName')
//         .populate('approvedBy', 'firstName lastName')
//         .sort({ date: -1 });

//       // Generate CSV
//       const csvRows = [];
//       csvRows.push('Expense Number,Date,Category,Description,Amount,Property,Unit,Paid To,Payment Method,Status,Tax Deductible,Tags,Notes');

//       for (const expense of expenses) {
//         csvRows.push([
//           expense.expenseNumber,
//           new Date(expense.date).toISOString().split('T')[0],
//           expense.category,
//           `"${expense.description.replace(/"/g, '""')}"`,
//           expense.amount,
//           expense.property?.title || 'Unknown',
//           expense.unit || '',
//           `"${expense.paidTo.replace(/"/g, '""')}"`,
//           expense.paymentMethod,
//           expense.status,
//           expense.taxDeductible ? 'Yes' : 'No',
//           expense.tags.join('; '),
//           `"${(expense.notes || '').replace(/"/g, '""')}"`
//         ].join(','));
//       }

//       const csv = csvRows.join('\n');

//       res.setHeader('Content-Type', 'text/csv');
//       res.setHeader('Content-Disposition', `attachment; filename=expenses-${new Date().toISOString().split('T')[0]}.csv`);
//       res.status(200).send(csv);

//     } catch (error) {
//       console.error('Export expenses error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to export expenses",
//         error: error.message
//       });
//     }
//   },

//   // Process recurring expenses (to be called by cron job)
//   processRecurringExpenses: async (req, res) => {
//     try {
//       const today = new Date();
      
//       const recurringExpenses = await Expense.find({
//         recurring: true,
//         nextRecurrenceDate: { $lte: today },
//         status: { $in: ['approved', 'paid'] }
//       });

//       const created = [];

//       for (const expense of recurringExpenses) {
//         // Create new expense based on recurring template
//         const newExpense = new Expense({
//           ...expense.toObject(),
//           _id: new mongoose.Types.ObjectId(),
//           expenseNumber: undefined, // Will be generated
//           date: today,
//           status: 'pending',
//           approvedBy: undefined,
//           approvedAt: undefined,
//           paidAt: undefined,
//           recurring: true,
//           nextRecurrenceDate: undefined,
//           createdBy: expense.createdBy
//         });

//         // Calculate next recurrence date
//         const nextDate = new Date(today);
//         switch (expense.recurrence) {
//           case 'weekly':
//             nextDate.setDate(nextDate.getDate() + 7);
//             break;
//           case 'monthly':
//             nextDate.setMonth(nextDate.getMonth() + 1);
//             break;
//           case 'quarterly':
//             nextDate.setMonth(nextDate.getMonth() + 3);
//             break;
//           case 'yearly':
//             nextDate.setFullYear(nextDate.getFullYear() + 1);
//             break;
//         }
        
//         // Update original expense's next recurrence date
//         expense.nextRecurrenceDate = nextDate;
//         await expense.save();

//         // Save new expense
//         await newExpense.save();
//         created.push(newExpense);
//       }

//       res.status(200).json({
//         success: true,
//         message: `Processed ${created.length} recurring expenses`,
//         created
//       });

//     } catch (error) {
//       console.error('Process recurring expenses error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to process recurring expenses",
//         error: error.message
//       });
//     }
//   }
// };

// // Helper function to update budget spent amount
// async function updateBudgetSpent(budgetCategory, amountChange) {
//   try {
//     const budget = await Budget.findOne({ category: budgetCategory });
//     if (budget) {
//       budget.spent = (budget.spent || 0) + amountChange;
//       await budget.save();
//     }
//   } catch (error) {
//     console.error('Error updating budget spent:', error);
//   }
// }

// // Helper function to calculate expense statistics
// async function calculateExpenseStats(query) {
//   try {
//     const currentMonth = new Date();
//     currentMonth.setDate(1);
//     currentMonth.setHours(0, 0, 0, 0);
    
//     const nextMonth = new Date(currentMonth);
//     nextMonth.setMonth(nextMonth.getMonth() + 1);

//     const monthQuery = { ...query, date: { $gte: currentMonth, $lt: nextMonth } };

//     const [
//       monthlyExpenses,
//       pendingApproval,
//       approvedThisMonth,
//       taxDeductible
//     ] = await Promise.all([
//       Expense.aggregate([
//         { $match: monthQuery },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
//       ]),
//       Expense.aggregate([
//         { $match: { ...query, status: 'pending' } },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
//       ]),
//       Expense.aggregate([
//         { $match: { ...monthQuery, status: 'approved' } },
//         { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
//       ]),
//       Expense.aggregate([
//         { $match: { ...query, taxDeductible: true, status: { $in: ['approved', 'paid'] } } },
//         { $group: { _id: null, total: { $sum: '$amount' } } }
//       ])
//     ]);

//     return {
//       monthlyTotal: monthlyExpenses[0]?.total || 0,
//       monthlyCount: monthlyExpenses[0]?.count || 0,
//       pendingTotal: pendingApproval[0]?.total || 0,
//       pendingCount: pendingApproval[0]?.count || 0,
//       approvedThisMonth: approvedThisMonth[0]?.total || 0,
//       approvedCount: approvedThisMonth[0]?.count || 0,
//       taxDeductibleTotal: taxDeductible[0]?.total || 0
//     };

//   } catch (error) {
//     console.error('Error calculating expense stats:', error);
//     return {};
//   }
// }

// module.exports = expenseController;