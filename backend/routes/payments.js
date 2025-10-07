const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get payments (user's own or all for admin)
// @route   GET /api/v1/payments
// @access  Private
router.get('/', [
  query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  query('method').optional().isIn(['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet']).withMessage('Invalid payment method'),
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

    const { status, method, from_date, to_date, search, page = 1, limit = 10 } = req.query;

    // Build filters
    const filters = { search };
    if (status) filters.status = status;
    if (method) filters.method = method;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    // If not admin, only show user's own payments
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }

    if (req.query.all === 'true' && req.user.role === 'admin') {
      // Simple list for admin
      const payments = await Payment.findAll();
      return res.json({
        success: true,
        data: payments
      });
    }

    const result = await Payment.findWithPagination(page, limit, filters);

    res.json({
      success: true,
      data: result.payments,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment by ID
// @route   GET /api/v1/payments/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check if user owns this payment or is admin
    if (req.user.role !== 'admin' && payment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this payment'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new payment
// @route   POST /api/v1/payments
// @access  Private
router.post('/', [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('method')
    .isIn(['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'])
    .withMessage('Invalid payment method'),
  body('invoice_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid invoice ID'),
  body('gateway')
    .optional()
    .isIn(['razorpay', 'stripe', 'paytm', 'phonepe'])
    .withMessage('Invalid gateway')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const paymentData = {
      ...req.body,
      user_id: req.user.id, // Always use current user's ID
      status: 'pending',
      gateway: req.body.gateway || 'razorpay',
      currency: req.body.currency || 'INR'
    };

    const payment = await Payment.create(paymentData);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update payment (Admin only)
// @route   PUT /api/v1/payments/:id
// @access  Private (Admin only)
router.put('/:id', authorize('admin'), [
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('gateway_transaction_id')
    .optional()
    .isString()
    .withMessage('Gateway transaction ID must be a string'),
  body('error_message')
    .optional()
    .isString()
    .withMessage('Error message must be a string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const updateData = { ...req.body };
    if (req.body.status === 'completed' && !payment.processed_at) {
      updateData.processed_at = new Date();
    }

    const updatedPayment = await Payment.update(req.params.id, updateData);

    res.json({
      success: true,
      data: updatedPayment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark payment as completed
// @route   POST /api/v1/payments/:id/complete
// @access  Private (Admin only)
router.post('/:id/complete', authorize('admin'), [
  body('gateway_transaction_id')
    .optional()
    .isString()
    .withMessage('Gateway transaction ID must be a string'),
  body('gateway_response')
    .optional()
    .isObject()
    .withMessage('Gateway response must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Payment is already completed'
      });
    }

    const gatewayData = {
      transaction_id: req.body.gateway_transaction_id,
      response: req.body.gateway_response || {}
    };

    const updatedPayment = await Payment.markAsCompleted(req.params.id, gatewayData);

    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment marked as completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark payment as failed
// @route   POST /api/v1/payments/:id/fail
// @access  Private (Admin only)
router.post('/:id/fail', authorize('admin'), [
  body('error_message')
    .optional()
    .isString()
    .withMessage('Error message must be a string'),
  body('gateway_response')
    .optional()
    .isObject()
    .withMessage('Gateway response must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Payment is already marked as failed'
      });
    }

    const errorData = {
      message: req.body.error_message || 'Payment failed',
      response: req.body.gateway_response || {}
    };

    const updatedPayment = await Payment.markAsFailed(req.params.id, errorData);

    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment marked as failed'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get payment statistics
// @route   GET /api/v1/payments/stats/overview
// @access  Private (Admin only)
router.get('/stats/overview', authorize('admin'), async (req, res, next) => {
  try {
    const stats = await Payment.getPaymentStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get revenue by month
// @route   GET /api/v1/payments/revenue/monthly
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
    const revenueData = await Payment.getRevenueByMonth(year);
    
    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get revenue by payment method
// @route   GET /api/v1/payments/revenue/by-method
// @access  Private (Admin only)
router.get('/revenue/by-method', authorize('admin'), async (req, res, next) => {
  try {
    const methodData = await Payment.getRevenueByPaymentMethod();
    
    res.json({
      success: true,
      data: methodData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user payment summary
// @route   GET /api/v1/payments/my/summary
// @access  Private
router.get('/my/summary', async (req, res, next) => {
  try {
    const summary = await Payment.getUserPaymentSummary(req.user.id);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get recent payments
// @route   GET /api/v1/payments/recent/list
// @access  Private (Admin only)
router.get('/recent/list', authorize('admin'), [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const recentPayments = await Payment.getRecentPayments(limit);
    
    res.json({
      success: true,
      data: recentPayments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get daily revenue
// @route   GET /api/v1/payments/revenue/daily
// @access  Private (Admin only)
router.get('/revenue/daily', authorize('admin'), [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const days = req.query.days ? parseInt(req.query.days) : 30;
    const dailyRevenue = await Payment.getDailyRevenue(days);
    
    res.json({
      success: true,
      data: dailyRevenue
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
