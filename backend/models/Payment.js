const { db } = require('../utils/database');

class Payment {
  static tableName = 'payments';

  static async findAll() {
    return await db(this.tableName)
      .join('users', 'payments.user_id', 'users.id')
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .select(
        'payments.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id',
        'invoices.invoice_number'
      )
      .orderBy('payments.created_at', 'desc');
  }

  static async findById(id) {
    return await db(this.tableName)
      .join('users', 'payments.user_id', 'users.id')
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .select(
        'payments.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.customer_id',
        'invoices.invoice_number',
        'invoices.total_amount as invoice_total'
      )
      .where('payments.id', id)
      .first();
  }

  static async findByUserId(userId) {
    return await db(this.tableName)
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .select(
        'payments.*',
        'invoices.invoice_number'
      )
      .where('payments.user_id', userId)
      .orderBy('payments.created_at', 'desc');
  }

  static async findByInvoiceId(invoiceId) {
    return await db(this.tableName)
      .where('invoice_id', invoiceId)
      .orderBy('created_at', 'desc');
  }

  static async create(paymentData) {
    // Generate transaction ID if not provided
    if (!paymentData.transaction_id) {
      paymentData.transaction_id = await this.generateTransactionId();
    }

    const [id] = await db(this.tableName).insert({
      ...paymentData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return await this.findById(id);
  }

  static async update(id, paymentData) {
    await db(this.tableName)
      .where({ id })
      .update({
        ...paymentData,
        updated_at: new Date()
      });
    
    return await this.findById(id);
  }

  static async delete(id) {
    return await db(this.tableName).where({ id }).del();
  }

  static async generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TXN${timestamp}${random}`;
  }

  static async getPaymentsByStatus(status) {
    return await db(this.tableName)
      .join('users', 'payments.user_id', 'users.id')
      .select(
        'payments.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id'
      )
      .where('payments.status', status)
      .orderBy('payments.created_at', 'desc');
  }

  static async getPaymentStats() {
    const stats = await db(this.tableName)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed'),
        db.raw('COUNT(CASE WHEN status = "pending" THEN 1 END) as pending'),
        db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed'),
        db.raw('SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as total_collected'),
        db.raw('AVG(CASE WHEN status = "completed" THEN amount END) as avg_payment_amount')
      )
      .first();

    return {
      total: parseInt(stats.total),
      completed: parseInt(stats.completed),
      pending: parseInt(stats.pending),
      failed: parseInt(stats.failed),
      totalCollected: parseFloat(stats.total_collected) || 0,
      avgPaymentAmount: parseFloat(stats.avg_payment_amount) || 0
    };
  }

  static async findWithPagination(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = db(this.tableName)
      .join('users', 'payments.user_id', 'users.id')
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .select(
        'payments.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id',
        'invoices.invoice_number'
      );
    
    // Apply filters
    if (filters.status) {
      query = query.where('payments.status', filters.status);
    }
    
    if (filters.user_id) {
      query = query.where('payments.user_id', filters.user_id);
    }
    
    if (filters.method) {
      query = query.where('payments.method', filters.method);
    }
    
    if (filters.from_date) {
      query = query.where('payments.created_at', '>=', filters.from_date);
    }
    
    if (filters.to_date) {
      query = query.where('payments.created_at', '<=', filters.to_date);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('payments.transaction_id', 'like', `%${filters.search}%`)
            .orWhere('payments.gateway_transaction_id', 'like', `%${filters.search}%`)
            .orWhere('users.customer_id', 'like', `%${filters.search}%`)
            .orWhere('invoices.invoice_number', 'like', `%${filters.search}%`);
      });
    }
    
    const totalQuery = query.clone();
    const total = await totalQuery.count('payments.id as count').first();
    const payments = await query
      .orderBy('payments.created_at', 'desc')
      .offset(offset)
      .limit(limit);
    
    return {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  static async markAsCompleted(id, gatewayData = {}) {
    await db(this.tableName)
      .where({ id })
      .update({
        status: 'completed',
        gateway_response: JSON.stringify(gatewayData),
        gateway_transaction_id: gatewayData.transaction_id || null,
        processed_at: new Date(),
        updated_at: new Date()
      });

    return await this.findById(id);
  }

  static async markAsFailed(id, errorData = {}) {
    await db(this.tableName)
      .where({ id })
      .update({
        status: 'failed',
        gateway_response: JSON.stringify(errorData),
        error_message: errorData.message || null,
        updated_at: new Date()
      });

    return await this.findById(id);
  }

  static async getRevenueByMonth(year) {
    return await db(this.tableName)
      .select(
        db.raw('MONTH(created_at) as month'),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as payment_count')
      )
      .whereRaw('YEAR(created_at) = ?', [year])
      .where('status', 'completed')
      .groupBy(db.raw('MONTH(created_at)'))
      .orderBy('month');
  }

  static async getRevenueByPaymentMethod() {
    return await db(this.tableName)
      .select(
        'method',
        db.raw('SUM(amount) as total_amount'),
        db.raw('COUNT(*) as transaction_count')
      )
      .where('status', 'completed')
      .groupBy('method')
      .orderBy('total_amount', 'desc');
  }

  static async getUserPaymentSummary(userId) {
    const summary = await db(this.tableName)
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) as total_payments'),
        db.raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as successful_payments'),
        db.raw('COUNT(CASE WHEN status = "failed" THEN 1 END) as failed_payments'),
        db.raw('SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as total_paid')
      )
      .first();

    return {
      totalPayments: parseInt(summary.total_payments),
      successfulPayments: parseInt(summary.successful_payments),
      failedPayments: parseInt(summary.failed_payments),
      totalPaid: parseFloat(summary.total_paid) || 0
    };
  }

  static async getRecentPayments(limit = 10) {
    return await db(this.tableName)
      .join('users', 'payments.user_id', 'users.id')
      .leftJoin('invoices', 'payments.invoice_id', 'invoices.id')
      .select(
        'payments.id',
        'payments.amount',
        'payments.method',
        'payments.status',
        'payments.created_at',
        'users.first_name',
        'users.last_name',
        'users.customer_id',
        'invoices.invoice_number'
      )
      .orderBy('payments.created_at', 'desc')
      .limit(limit);
  }

  static async getDailyRevenue(days = 30) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return await db(this.tableName)
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as transaction_count')
      )
      .where('status', 'completed')
      .where('created_at', '>=', fromDate)
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date');
  }
}

module.exports = Payment;
