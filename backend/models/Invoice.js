const { db } = require('../utils/database');

class Invoice {
  static tableName = 'invoices';

  static async findAll() {
    return await db(this.tableName)
      .join('users', 'invoices.user_id', 'users.id')
      .select(
        'invoices.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.customer_id'
      )
      .orderBy('invoices.created_at', 'desc');
  }

  static async findById(id) {
    return await db(this.tableName)
      .join('users', 'invoices.user_id', 'users.id')
      .select(
        'invoices.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.customer_id',
        'users.phone',
        'users.address'
      )
      .where('invoices.id', id)
      .first();
  }

  static async findByUserId(userId) {
    return await db(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
  }

  static async findByInvoiceNumber(invoiceNumber) {
    return await db(this.tableName)
      .join('users', 'invoices.user_id', 'users.id')
      .select(
        'invoices.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.customer_id'
      )
      .where('invoice_number', invoiceNumber)
      .first();
  }

  static async create(invoiceData) {
    // Generate invoice number if not provided
    if (!invoiceData.invoice_number) {
      invoiceData.invoice_number = await this.generateInvoiceNumber();
    }

    const [id] = await db(this.tableName).insert({
      ...invoiceData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return await this.findById(id);
  }

  static async update(id, invoiceData) {
    await db(this.tableName)
      .where({ id })
      .update({
        ...invoiceData,
        updated_at: new Date()
      });
    
    return await this.findById(id);
  }

  static async delete(id) {
    return await db(this.tableName).where({ id }).del();
  }

  static async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the last invoice number for this month
    const lastInvoice = await db(this.tableName)
      .where('invoice_number', 'like', `INV-${year}${month}%`)
      .orderBy('invoice_number', 'desc')
      .first();

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoice_number.split('-')[1].slice(6));
      sequence = lastSequence + 1;
    }

    return `INV-${year}${month}${sequence.toString().padStart(4, '0')}`;
  }

  static async getInvoicesByStatus(status) {
    return await db(this.tableName)
      .join('users', 'invoices.user_id', 'users.id')
      .select(
        'invoices.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id'
      )
      .where('invoices.status', status)
      .orderBy('invoices.due_date', 'asc');
  }

  static async getOverdueInvoices() {
    return await db(this.tableName)
      .join('users', 'invoices.user_id', 'users.id')
      .select(
        'invoices.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.customer_id'
      )
      .where('invoices.due_date', '<', new Date())
      .whereIn('invoices.status', ['sent', 'overdue'])
      .where('invoices.outstanding_amount', '>', 0)
      .orderBy('invoices.due_date', 'asc');
  }

  static async getInvoiceStats() {
    const stats = await db(this.tableName)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = "paid" THEN 1 END) as paid'),
        db.raw('COUNT(CASE WHEN status = "overdue" THEN 1 END) as overdue'),
        db.raw('COUNT(CASE WHEN status = "sent" THEN 1 END) as pending'),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('SUM(outstanding_amount) as outstanding'),
        db.raw('AVG(total_amount) as avg_invoice_amount')
      )
      .first();

    return {
      total: parseInt(stats.total),
      paid: parseInt(stats.paid),
      overdue: parseInt(stats.overdue),
      pending: parseInt(stats.pending),
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      outstanding: parseFloat(stats.outstanding) || 0,
      avgInvoiceAmount: parseFloat(stats.avg_invoice_amount) || 0
    };
  }

  static async findWithPagination(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = db(this.tableName)
      .join('users', 'invoices.user_id', 'users.id')
      .select(
        'invoices.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id'
      );
    
    // Apply filters
    if (filters.status) {
      query = query.where('invoices.status', filters.status);
    }
    
    if (filters.user_id) {
      query = query.where('invoices.user_id', filters.user_id);
    }
    
    if (filters.from_date) {
      query = query.where('invoices.billing_period_start', '>=', filters.from_date);
    }
    
    if (filters.to_date) {
      query = query.where('invoices.billing_period_end', '<=', filters.to_date);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('invoices.invoice_number', 'like', `%${filters.search}%`)
            .orWhere('users.customer_id', 'like', `%${filters.search}%`)
            .orWhere('users.first_name', 'like', `%${filters.search}%`)
            .orWhere('users.last_name', 'like', `%${filters.search}%`);
      });
    }
    
    const totalQuery = query.clone();
    const total = await totalQuery.count('invoices.id as count').first();
    const invoices = await query
      .orderBy('invoices.created_at', 'desc')
      .offset(offset)
      .limit(limit);
    
    return {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  static async markAsPaid(id, paymentData) {
    const invoice = await this.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    await db(this.tableName)
      .where({ id })
      .update({
        status: 'paid',
        paid_amount: invoice.total_amount,
        outstanding_amount: 0,
        paid_at: new Date(),
        payment_reference: paymentData.reference || null,
        updated_at: new Date()
      });

    return await this.findById(id);
  }

  static async getRevenueByMonth(year) {
    return await db(this.tableName)
      .select(
        db.raw('MONTH(billing_period_start) as month'),
        db.raw('SUM(total_amount) as revenue'),
        db.raw('COUNT(*) as invoice_count')
      )
      .whereRaw('YEAR(billing_period_start) = ?', [year])
      .where('status', 'paid')
      .groupBy(db.raw('MONTH(billing_period_start)'))
      .orderBy('month');
  }

  static async getUserInvoiceSummary(userId) {
    const summary = await db(this.tableName)
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) as total_invoices'),
        db.raw('COUNT(CASE WHEN status = "paid" THEN 1 END) as paid_invoices'),
        db.raw('COUNT(CASE WHEN status = "overdue" THEN 1 END) as overdue_invoices'),
        db.raw('SUM(total_amount) as total_billed'),
        db.raw('SUM(outstanding_amount) as total_outstanding')
      )
      .first();

    return {
      totalInvoices: parseInt(summary.total_invoices),
      paidInvoices: parseInt(summary.paid_invoices),
      overdueInvoices: parseInt(summary.overdue_invoices),
      totalBilled: parseFloat(summary.total_billed) || 0,
      totalOutstanding: parseFloat(summary.total_outstanding) || 0
    };
  }
}

module.exports = Invoice;
