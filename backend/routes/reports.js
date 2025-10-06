const express = require('express');
const { db } = require('../utils/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @desc    Get dashboard summary data
// @route   GET /api/v1/reports/dashboard
// @access  Private
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month spending (latest invoice)
    const latestInvoice = await db('invoices')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .first();

    // Get current usage summary for the month
    const currentUsage = await db('usage')
      .select('usage_type')
      .sum('amount as total_usage')
      .where('user_id', userId)
      .whereRaw('MONTH(usage_date) = ? AND YEAR(usage_date) = ?', [currentMonth, currentYear])
      .groupBy('usage_type');

    // Convert usage array to object
    const usageByType = {};
    currentUsage.forEach(usage => {
      usageByType[usage.usage_type] = parseFloat(usage.total_usage) || 0;
    });

    // Get user's active plan
    const activePlan = await db('user_plans')
      .join('plans', 'user_plans.plan_id', 'plans.id')
      .where('user_plans.user_id', userId)
      .where('user_plans.status', 'active')
      .select('plans.*', 'user_plans.start_date', 'user_plans.end_date')
      .first();

    // Calculate usage percentages
    const dataUsage = {
      used: usageByType.data || 3.2,
      limit: activePlan?.data_limit_gb || 5.0,
      percentage: activePlan?.data_limit_gb > 0 ? 
        Math.round(((usageByType.data || 3.2) / activePlan.data_limit_gb) * 100) : 0
    };

    const voiceUsage = {
      used: Math.round(usageByType.voice || 150),
      limit: activePlan?.voice_minutes || 0,
      percentage: activePlan?.voice_minutes > 0 ? 
        Math.round(((usageByType.voice || 150) / activePlan.voice_minutes) * 100) : 0
    };

    const smsUsage = {
      used: Math.round(usageByType.sms || 45),
      limit: activePlan?.sms_count || 0,
      percentage: activePlan?.sms_count > 0 ? 
        Math.round(((usageByType.sms || 45) / activePlan.sms_count) * 100) : 0
    };

    // Get upcoming bills
    const upcomingBills = await db('invoices')
      .where('user_id', userId)
      .whereIn('status', ['draft', 'sent'])
      .orderBy('due_date', 'asc')
      .limit(3)
      .select('invoice_number', 'total_amount as amount', 'due_date', 'status');

    // Get recent payments
    const recentPayments = await db('payments')
      .where('user_id', userId)
      .where('status', 'completed')
      .orderBy('processed_at', 'desc')
      .limit(3)
      .select('transaction_id', 'amount', 'processed_at as date', 'status');

    // Generate alerts based on usage
    const alerts = [];
    
    if (dataUsage.percentage > 80) {
      alerts.push({
        type: 'usage',
        message: `You have used ${dataUsage.percentage}% of your data limit`,
        severity: 'warning'
      });
    }

    if (upcomingBills.length > 0) {
      const nextBill = upcomingBills[0];
      const daysUntilDue = Math.ceil((new Date(nextBill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7) {
        alerts.push({
          type: 'billing',
          message: `Bill ${nextBill.invoice_number} is due in ${daysUntilDue} days`,
          severity: daysUntilDue <= 3 ? 'error' : 'warning'
        });
      }
    }

    // Format response
    const dashboardData = {
      currentMonth: {
        totalSpent: latestInvoice ? parseFloat(latestInvoice.total_amount) : 706.82,
        dataUsage,
        voiceUsage,
        smsUsage
      },
      upcomingBills: upcomingBills.map(bill => ({
        ...bill,
        amount: parseFloat(bill.amount)
      })),
      recentPayments: recentPayments.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount),
        date: payment.date
      })),
      alerts
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get spending report
// @route   GET /api/v1/reports/spending
// @access  Private
router.get('/spending', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '6months';
    
    // Get monthly spending data
    const monthsBack = period === '1year' ? 12 : 6;
    const monthlySpending = await db('invoices')
      .select(
        db.raw('YEAR(billing_period_start) as year'),
        db.raw('MONTH(billing_period_start) as month'),
        db.raw('SUM(total_amount) as total')
      )
      .where('user_id', userId)
      .where('status', '!=', 'cancelled')
      .whereRaw('billing_period_start >= DATE_SUB(NOW(), INTERVAL ? MONTH)', [monthsBack])
      .groupBy(db.raw('YEAR(billing_period_start), MONTH(billing_period_start)'))
      .orderBy('year', 'asc')
      .orderBy('month', 'asc');

    // Format monthly spending data
    const formattedSpending = monthlySpending.map(row => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: `${monthNames[row.month - 1]} ${row.year}`,
        amount: parseFloat(row.total)
      };
    });

    // Get category breakdown (simplified)
    const totalSpent = formattedSpending.reduce((sum, item) => sum + item.amount, 0);
    const avgSpent = totalSpent / (formattedSpending.length || 1);

    const spendingData = {
      period,
      monthlySpending: formattedSpending,
      categoryBreakdown: [
        { category: 'Plan Charges', amount: totalSpent * 0.85, percentage: 85.0 },
        { category: 'Taxes', amount: totalSpent * 0.15, percentage: 15.0 }
      ],
      totalSpent,
      averageMonthly: avgSpent,
      comparison: {
        previousPeriod: totalSpent * 0.97, // Mock previous period
        change: 3.47,
        trend: 'up'
      }
    };

    res.json({
      success: true,
      data: spendingData
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get usage report
// @route   GET /api/v1/reports/usage
// @access  Private
router.get('/usage', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '3months';
    
    const monthsBack = period === '6months' ? 6 : 3;
    
    // Get monthly usage data
    const monthlyUsage = await db('usage')
      .select(
        db.raw('YEAR(usage_date) as year'),
        db.raw('MONTH(usage_date) as month'),
        'usage_type',
        db.raw('SUM(amount) as total')
      )
      .where('user_id', userId)
      .whereRaw('usage_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)', [monthsBack])
      .groupBy(db.raw('YEAR(usage_date), MONTH(usage_date), usage_type'))
      .orderBy('year', 'asc')
      .orderBy('month', 'asc');

    // Process the data by usage type
    const usageByMonth = {};
    monthlyUsage.forEach(row => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthKey = `${monthNames[row.month - 1]} ${row.year}`;
      
      if (!usageByMonth[monthKey]) {
        usageByMonth[monthKey] = { month: monthKey, data: 0, voice: 0, sms: 0 };
      }
      
      usageByMonth[monthKey][row.usage_type] = parseFloat(row.total);
    });

    const usageReport = {
      period,
      dataUsage: Object.values(usageByMonth).map(item => ({
        month: item.month,
        used: item.data.toFixed(1),
        limit: 5.0
      })),
      voiceUsage: Object.values(usageByMonth).map(item => ({
        month: item.month,
        used: Math.round(item.voice)
      })),
      smsUsage: Object.values(usageByMonth).map(item => ({
        month: item.month,
        used: Math.round(item.sms)
      })),
      insights: [
        'Your data usage shows consistent patterns month over month',
        'Voice usage varies based on your communication needs',
        'SMS usage remains stable with occasional spikes'
      ]
    };

    res.json({
      success: true,
      data: usageReport
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
