const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Usage = require('../models/Usage');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get usage records (user's own or all for admin)
// @route   GET /api/v1/usage
// @access  Private
router.get('/', [
  query('service_type').optional().isIn(['voice', 'data', 'sms', 'general']).withMessage('Invalid service type'),
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

    const { service_type, from_date, to_date, search, page = 1, limit = 10 } = req.query;

    // Build filters
    const filters = { search };
    if (service_type) filters.service_type = service_type;
    if (from_date) filters.from_date = from_date;
    if (to_date) filters.to_date = to_date;

    // If not admin, only show user's own usage
    if (req.user.role !== 'admin') {
      filters.user_id = req.user.id;
    }

    if (req.query.all === 'true' && req.user.role === 'admin') {
      // Simple list for admin
      const usage = await Usage.findAll();
      return res.json({
        success: true,
        data: usage
      });
    }

    const result = await Usage.findWithPagination(page, limit, filters);

    res.json({
      success: true,
      data: result.usage,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get usage record by ID
// @route   GET /api/v1/usage/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const usage = await Usage.findById(req.params.id);
    
    if (!usage) {
      return res.status(404).json({
        success: false,
        error: 'Usage record not found'
      });
    }

    // Check if user owns this usage record or is admin
    if (req.user.role !== 'admin' && usage.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this usage record'
      });
    }

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new usage record
// @route   POST /api/v1/usage
// @access  Private (Admin only)
router.post('/', authorize('admin'), [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('usage_date')
    .isISO8601()
    .withMessage('Valid usage date is required'),
  body('service_type')
    .optional()
    .isIn(['voice', 'data', 'sms', 'general'])
    .withMessage('Invalid service type'),
  body('data_used_mb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Data used must be a positive number'),
  body('voice_minutes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Voice minutes must be a positive number'),
  body('sms_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('SMS count must be a positive integer'),
  body('data_charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Data charges must be a positive number'),
  body('voice_charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Voice charges must be a positive number'),
  body('sms_charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('SMS charges must be a positive number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const usageData = {
      ...req.body,
      service_type: req.body.service_type || 'general',
      data_used_mb: req.body.data_used_mb || 0,
      voice_minutes: req.body.voice_minutes || 0,
      sms_count: req.body.sms_count || 0,
      data_charges: req.body.data_charges || 0,
      voice_charges: req.body.voice_charges || 0,
      sms_charges: req.body.sms_charges || 0
    };

    const usage = await Usage.create(usageData);

    res.status(201).json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Record usage for current user
// @route   POST /api/v1/usage/record
// @access  Private
router.post('/record', [
  body('service_type')
    .optional()
    .isIn(['voice', 'data', 'sms', 'general'])
    .withMessage('Invalid service type'),
  body('data_used_mb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Data used must be a positive number'),
  body('voice_minutes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Voice minutes must be a positive number'),
  body('sms_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('SMS count must be a positive integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const usageData = {
      service_type: req.body.service_type || 'general',
      data_used_mb: req.body.data_used_mb || 0,
      voice_minutes: req.body.voice_minutes || 0,
      sms_count: req.body.sms_count || 0,
      data_charges: req.body.data_charges || 0,
      voice_charges: req.body.voice_charges || 0,
      sms_charges: req.body.sms_charges || 0
    };

    const usage = await Usage.recordUsage(req.user.id, usageData);

    res.json({
      success: true,
      data: usage,
      message: 'Usage recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update usage record
// @route   PUT /api/v1/usage/:id
// @access  Private (Admin only)
router.put('/:id', authorize('admin'), [
  body('usage_date')
    .optional()
    .isISO8601()
    .withMessage('Valid usage date is required'),
  body('service_type')
    .optional()
    .isIn(['voice', 'data', 'sms', 'general'])
    .withMessage('Invalid service type'),
  body('data_used_mb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Data used must be a positive number'),
  body('voice_minutes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Voice minutes must be a positive number'),
  body('sms_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('SMS count must be a positive integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const usage = await Usage.findById(req.params.id);
    if (!usage) {
      return res.status(404).json({
        success: false,
        error: 'Usage record not found'
      });
    }

    const updatedUsage = await Usage.update(req.params.id, req.body);

    res.json({
      success: true,
      data: updatedUsage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete usage record
// @route   DELETE /api/v1/usage/:id
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const usage = await Usage.findById(req.params.id);
    if (!usage) {
      return res.status(404).json({
        success: false,
        error: 'Usage record not found'
      });
    }

    await Usage.delete(req.params.id);

    res.json({
      success: true,
      message: 'Usage record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user's usage summary
// @route   GET /api/v1/usage/my/summary
// @access  Private
router.get('/my/summary', [
  query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end_date format')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const now = new Date();
    const startDate = req.query.start_date ? new Date(req.query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = req.query.end_date ? new Date(req.query.end_date) : now;

    const summary = await Usage.getUserUsageSummary(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current month usage for user
// @route   GET /api/v1/usage/my/current-month
// @access  Private
router.get('/my/current-month', async (req, res, next) => {
  try {
    const usage = await Usage.getCurrentMonthUsage(req.user.id);

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get usage trends for user
// @route   GET /api/v1/usage/my/trends
// @access  Private
router.get('/my/trends', [
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const months = req.query.months ? parseInt(req.query.months) : 6;
    const trends = await Usage.getUsageTrends(req.user.id, months);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get daily usage for user
// @route   GET /api/v1/usage/my/daily
// @access  Private
router.get('/my/daily', [
  query('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dailyUsage = await Usage.getDailyUsage(req.user.id, date);

    res.json({
      success: true,
      data: dailyUsage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get monthly usage breakdown for user
// @route   GET /api/v1/usage/my/monthly
// @access  Private
router.get('/my/monthly', [
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12')
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
    const month = req.query.month || (new Date().getMonth() + 1);

    const monthlyUsage = await Usage.getMonthlyUsage(req.user.id, year, month);

    res.json({
      success: true,
      data: monthlyUsage
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get hourly usage pattern for user
// @route   GET /api/v1/usage/my/hourly
// @access  Private
router.get('/my/hourly', [
  query('date').optional().isISO8601().withMessage('Invalid date format')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const date = req.query.date || new Date().toISOString().split('T')[0];
    const hourlyPattern = await Usage.getHourlyUsagePattern(req.user.id, date);

    res.json({
      success: true,
      data: hourlyPattern
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get usage statistics (Admin only)
// @route   GET /api/v1/usage/stats/overview
// @access  Private (Admin only)
router.get('/stats/overview', authorize('admin'), async (req, res, next) => {
  try {
    const stats = await Usage.getUserUsageStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get top data users (Admin only)
// @route   GET /api/v1/usage/stats/top-users
// @access  Private (Admin only)
router.get('/stats/top-users', authorize('admin'), [
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
    const topUsers = await Usage.getTopDataUsers(limit);

    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get usage by service type for user
// @route   GET /api/v1/usage/my/by-service
// @access  Private
router.get('/my/by-service', [
  query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
  query('end_date').optional().isISO8601().withMessage('Invalid end_date format')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const now = new Date();
    const startDate = req.query.start_date ? new Date(req.query.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = req.query.end_date ? new Date(req.query.end_date) : now;

    const usageByService = await Usage.getUsageByServiceType(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: usageByService
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
