const { db } = require('../utils/database');

class Plan {
  static tableName = 'plans';

  static async findAll() {
    return await db(this.tableName)
      .where('status', 'active')
      .orderBy('created_at', 'desc');
  }

  static async findById(id) {
    return await db(this.tableName).where({ id }).first();
  }

  static async findByName(name) {
    return await db(this.tableName).where({ name }).first();
  }

  static async create(planData) {
    const [id] = await db(this.tableName).insert({
      ...planData,
      created_at: new Date(),
      updated_at: new Date()
    });
    return await this.findById(id);
  }

  static async update(id, planData) {
    await db(this.tableName)
      .where({ id })
      .update({
        ...planData,
        updated_at: new Date()
      });
    
    return await this.findById(id);
  }

  static async delete(id) {
    return await db(this.tableName).where({ id }).del();
  }

  static async getActivePlans() {
    return await db(this.tableName)
      .where('status', 'active')
      .select('*')
      .orderBy('monthly_price', 'asc');
  }

  static async getPlansByType(type) {
    return await db(this.tableName)
      .where({ type, status: 'active' })
      .orderBy('monthly_price', 'asc');
  }

  static async getPlanStats() {
    const stats = await db(this.tableName)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active'),
        db.raw('COUNT(CASE WHEN status = "inactive" THEN 1 END) as inactive'),
        db.raw('COUNT(CASE WHEN type = "prepaid" THEN 1 END) as prepaid'),
        db.raw('COUNT(CASE WHEN type = "postpaid" THEN 1 END) as postpaid'),
        db.raw('AVG(monthly_price) as avg_price')
      )
      .first();

    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      inactive: parseInt(stats.inactive),
      prepaid: parseInt(stats.prepaid),
      postpaid: parseInt(stats.postpaid),
      avgPrice: parseFloat(stats.avg_price) || 0
    };
  }

  static async findWithPagination(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = db(this.tableName).select('*');
    
    // Apply filters
    if (filters.type) {
      query = query.where('type', filters.type);
    }
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('name', 'like', `%${filters.search}%`)
            .orWhere('description', 'like', `%${filters.search}%`);
      });
    }
    
    const totalQuery = query.clone();
    const total = await totalQuery.count('id as count').first();
    const plans = await query.orderBy('created_at', 'desc').offset(offset).limit(limit);
    
    return {
      plans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  static async getPopularPlans(limit = 5) {
    return await db(this.tableName)
      .join('user_plans', 'plans.id', 'user_plans.plan_id')
      .select('plans.*', db.raw('COUNT(user_plans.user_id) as subscriber_count'))
      .where('plans.status', 'active')
      .groupBy('plans.id')
      .orderBy('subscriber_count', 'desc')
      .limit(limit);
  }
}

module.exports = Plan;
