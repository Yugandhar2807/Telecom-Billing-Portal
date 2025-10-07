const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get user's invoices or all invoices (admin)
// @route   GET /api/v1/invoices
// @access  Private
router.get('/', [
  query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
  query('from_date').optional().isISO8601().withMessage('Invalid from_date format'),
  query('to_date').optional().isISO8601().withMessage('Invalid to_date format'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, from_date, to_date, search, page = 1, limit = 10 } = req.query;

    // Build filters
    const filters = { search };
    if (status) filters.status = status;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    // If not admin, only show user's own invoices
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }

    if (req.query.all === 'true' && req.user.role === 'admin') {
      // Simple list for admin
      const invoices = await Invoice.findAll();
      return res.json({
        success: true,
        data: invoices
      });
    }

    const result = await Invoice.findWithPagination(page, limit, filters);

    res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get invoice by ID
// @route   GET /api/v1/invoices/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if user owns this invoice or is admin
    if (req.user.role !== 'admin' && invoice.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this invoice'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get invoice by invoice number
// @route   GET /api/v1/invoices/number/:invoiceNumber
// @access  Private
router.get('/number/:invoiceNumber', async (req, res, next) => {
  try {
    const invoice = await Invoice.findByInvoiceNumber(req.params.invoiceNumber);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if user owns this invoice or is admin
    if (req.user.role !== 'admin' && invoice.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this invoice'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices
// @access  Private (Admin only)
router.post('/', authorize('admin'), [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('billing_period_start')
    .isISO8601()
    .withMessage('Valid billing period start date is required'),
  body('billing_period_end')
    .isISO8601()
    .withMessage('Valid billing period end date is required'),
  body('due_date')
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  body('total_amount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('tax_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax amount must be a positive number'),
  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const invoiceData = {
      ...req.body,
      outstanding_amount: req.body.total_amount - (req.body.paid_amount || 0),
      status: req.body.status || 'draft',
      line_items: req.body.line_items ? JSON.stringify(req.body.line_items) : null,
      usage_details: req.body.usage_details ? JSON.stringify(req.body.usage_details) : null
    };

    const invoice = await Invoice.create(invoiceData);

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private (Admin only)
router.put('/:id', authorize('admin'), [
  body('billing_period_start')
    .optional()
    .isISO8601()
    .withMessage('Valid billing period start date is required'),
  body('billing_period_end')
    .optional()
    .isISO8601()
    .withMessage('Valid billing period end date is required'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  body('total_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const updateData = { ...req.body };
    if (req.body.line_items) updateData.line_items = JSON.stringify(req.body.line_items);
    if (req.body.usage_details) updateData.usage_details = JSON.stringify(req.body.usage_details);
    
    // Recalculate outstanding amount if total amount or paid amount changes
    if (req.body.total_amount || req.body.paid_amount) {
      const totalAmount = req.body.total_amount || invoice.total_amount;
      const paidAmount = req.body.paid_amount || invoice.paid_amount;
      updateData.outstanding_amount = totalAmount - paidAmount;
    }

    const updatedInvoice = await Invoice.update(req.params.id, updateData);

    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark invoice as paid
// @route   POST /api/v1/invoices/:id/pay
// @access  Private (Admin only or invoice owner)
router.post('/:id/pay', [
  body('payment_reference')
    .optional()
    .isString()
    .withMessage('Payment reference must be a string'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if user owns this invoice or is admin
    if (req.user.role !== 'admin' && invoice.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to pay this invoice'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Invoice is already paid'
      });
    }

    const paymentData = {
      reference: req.body.payment_reference || `PAY-${Date.now()}`
    };

    const updatedInvoice = await Invoice.markAsPaid(req.params.id, paymentData);

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice marked as paid successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get overdue invoices
// @route   GET /api/v1/invoices/overdue/list
// @access  Private (Admin only)
router.get('/overdue/list', authorize('admin'), async (req, res, next) => {
  try {
    const overdueInvoices = await Invoice.getOverdueInvoices();
    
    res.json({
      success: true,
      data: overdueInvoices
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get invoice statistics
// @route   GET /api/v1/invoices/stats/overview
// @access  Private (Admin only)
router.get('/stats/overview', authorize('admin'), async (req, res, next) => {
  try {
    const stats = await Invoice.getInvoiceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get revenue by month
// @route   GET /api/v1/invoices/revenue/monthly
// @access  Private (Admin only)
router.get('/revenue/monthly', authorize('admin'), [
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const year = req.query.year || new Date().getFullYear();
    const revenueData = await Invoice.getRevenueByMonth(year);
    
    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user invoice summary
// @route   GET /api/v1/invoices/user/:userId/summary
// @access  Private
router.get('/user/:userId/summary', async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Check if user can access this summary
    if (req.user.role !== 'admin' && req.user.id != userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this user summary'
      });
    }

    const summary = await Invoice.getUserInvoiceSummary(userId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user invoice summary
// @route   GET /api/v1/invoices/my/summary
// @access  Private
router.get('/my/summary', async (req, res, next) => {
  try {
    const summary = await Invoice.getUserInvoiceSummary(req.user.id);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
