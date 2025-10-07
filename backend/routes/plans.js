const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Plan = require('../models/Plan');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get all plans
// @route   GET /api/v1/plans
// @access  Public (for customers to view available plans)
router.get('/', [
  query('type').optional().isIn(['prepaid', 'postpaid']).withMessage('Type must be prepaid or postpaid'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
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

    const { type, status = 'active', search, page = 1, limit = 10 } = req.query;

    if (req.query.all === 'true') {
      // Simple list for dropdowns
      const plans = type ? await Plan.getPlansByType(type) : await Plan.getActivePlans();
      return res.json({
        success: true,
        data: plans
      });
    }

    // Paginated results with filters
    const filters = { status, search };
    if (type) filters.type = type;

    const result = await Plan.findWithPagination(page, limit, filters);

    res.json({
      success: true,
      data: result.plans,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get plan by ID
// @route   GET /api/v1/plans/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new plan
// @route   POST /api/v1/plans
// @access  Private (Admin only)
router.post('/', authorize('admin'), [
  body('name')
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Plan name must be between 3 and 100 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .isIn(['prepaid', 'postpaid'])
    .withMessage('Type must be prepaid or postpaid'),
  body('monthly_price')
    .isFloat({ min: 0 })
    .withMessage('Monthly price must be a positive number'),
  body('data_limit_gb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Data limit must be a positive number'),
  body('voice_minutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Voice minutes must be a positive integer'),
  body('sms_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('SMS count must be a positive integer'),
  body('validity_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Validity days must be a positive integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if plan name already exists
    const existingPlan = await Plan.findByName(req.body.name);
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: 'Plan with this name already exists'
      });
    }

    const planData = {
      ...req.body,
      status: req.body.status || 'active',
      features: req.body.features ? JSON.stringify(req.body.features) : null,
      limitations: req.body.limitations ? JSON.stringify(req.body.limitations) : null
    };

    const plan = await Plan.create(planData);

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update plan
// @route   PUT /api/v1/plans/:id
// @access  Private (Admin only)
router.put('/:id', authorize('admin'), [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plan name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .optional()
    .isIn(['prepaid', 'postpaid'])
    .withMessage('Type must be prepaid or postpaid'),
  body('monthly_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly price must be a positive number'),
  body('data_limit_gb')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Data limit must be a positive number'),
  body('voice_minutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Voice minutes must be a positive integer'),
  body('sms_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('SMS count must be a positive integer'),
  body('validity_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Validity days must be a positive integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Check if new name conflicts with existing plans
    if (req.body.name && req.body.name !== plan.name) {
      const existingPlan = await Plan.findByName(req.body.name);
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          error: 'Plan with this name already exists'
        });
      }
    }

    const updateData = { ...req.body };
    if (req.body.features) updateData.features = JSON.stringify(req.body.features);
    if (req.body.limitations) updateData.limitations = JSON.stringify(req.body.limitations);

    const updatedPlan = await Plan.update(req.params.id, updateData);

    res.json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete plan
// @route   DELETE /api/v1/plans/:id
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    await Plan.delete(req.params.id);

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get plan statistics
// @route   GET /api/v1/plans/stats
// @access  Private (Admin only)
router.get('/stats/overview', authorize('admin'), async (req, res, next) => {
  try {
    const stats = await Plan.getPlanStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get popular plans
// @route   GET /api/v1/plans/popular
// @access  Public
router.get('/popular/list', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const popularPlans = await Plan.getPopularPlans(limit);
    
    res.json({
      success: true,
      data: popularPlans
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
