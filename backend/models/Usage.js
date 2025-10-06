const { db } = require('../utils/database');

class Usage {
  static tableName = 'usage';

  static async findAll() {
    return await db(this.tableName)
      .join('users', 'usage.user_id', 'users.id')
      .select(
        'usage.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id'
      )
      .orderBy('usage.created_at', 'desc');
  }

  static async findById(id) {
    return await db(this.tableName)
      .join('users', 'usage.user_id', 'users.id')
      .select(
        'usage.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id'
      )
      .where('usage.id', id)
      .first();
  }

  static async findByUserId(userId, limit = null) {
    let query = db(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  static async create(usageData) {
    const [id] = await db(this.tableName).insert({
      ...usageData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return await this.findById(id);
  }

  static async update(id, usageData) {
    await db(this.tableName)
      .where({ id })
      .update({
        ...usageData,
        updated_at: new Date()
      });
    
    return await this.findById(id);
  }

  static async delete(id) {
    return await db(this.tableName).where({ id }).del();
  }

  static async getUserUsageByPeriod(userId, startDate, endDate) {
    return await db(this.tableName)
      .where('user_id', userId)
      .whereBetween('usage_date', [startDate, endDate])
      .orderBy('usage_date', 'desc');
  }

  static async getUserUsageSummary(userId, startDate, endDate) {
    const summary = await db(this.tableName)
      .where('user_id', userId)
      .whereBetween('usage_date', [startDate, endDate])
      .select(
        db.raw('SUM(data_used_mb) as total_data'),
        db.raw('SUM(voice_minutes) as total_voice'),
        db.raw('SUM(sms_count) as total_sms'),
        db.raw('SUM(data_charges) as total_data_charges'),
        db.raw('SUM(voice_charges) as total_voice_charges'),
        db.raw('SUM(sms_charges) as total_sms_charges'),
        db.raw('COUNT(DISTINCT DATE(usage_date)) as days_with_usage')
      )
      .first();

    return {
      totalData: parseFloat(summary.total_data) || 0,
      totalVoice: parseFloat(summary.total_voice) || 0,
      totalSms: parseInt(summary.total_sms) || 0,
      totalDataCharges: parseFloat(summary.total_data_charges) || 0,
      totalVoiceCharges: parseFloat(summary.total_voice_charges) || 0,
      totalSmsCharges: parseFloat(summary.total_sms_charges) || 0,
      daysWithUsage: parseInt(summary.days_with_usage) || 0,
      totalCharges: (parseFloat(summary.total_data_charges) || 0) + 
                   (parseFloat(summary.total_voice_charges) || 0) + 
                   (parseFloat(summary.total_sms_charges) || 0)
    };
  }

  static async getDailyUsage(userId, date) {
    return await db(this.tableName)
      .where('user_id', userId)
      .whereRaw('DATE(usage_date) = ?', [date])
      .orderBy('usage_date', 'desc');
  }

  static async getMonthlyUsage(userId, year, month) {
    return await db(this.tableName)
      .where('user_id', userId)
      .whereRaw('YEAR(usage_date) = ? AND MONTH(usage_date) = ?', [year, month])
      .select(
        db.raw('DATE(usage_date) as date'),
        db.raw('SUM(data_used_mb) as daily_data'),
        db.raw('SUM(voice_minutes) as daily_voice'),
        db.raw('SUM(sms_count) as daily_sms'),
        db.raw('SUM(data_charges + voice_charges + sms_charges) as daily_charges')
      )
      .groupBy(db.raw('DATE(usage_date)'))
      .orderBy('date');
  }

  static async getUserUsageStats() {
    const stats = await db(this.tableName)
      .join('users', 'usage.user_id', 'users.id')
      .select(
        db.raw('COUNT(DISTINCT usage.user_id) as active_users'),
        db.raw('AVG(usage.data_used_mb) as avg_data_usage'),
        db.raw('AVG(usage.voice_minutes) as avg_voice_usage'),
        db.raw('AVG(usage.sms_count) as avg_sms_usage'),
        db.raw('SUM(usage.data_charges + usage.voice_charges + usage.sms_charges) as total_usage_charges')
      )
      .whereRaw('usage.usage_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
      .first();

    return {
      activeUsers: parseInt(stats.active_users) || 0,
      avgDataUsage: parseFloat(stats.avg_data_usage) || 0,
      avgVoiceUsage: parseFloat(stats.avg_voice_usage) || 0,
      avgSmsUsage: parseFloat(stats.avg_sms_usage) || 0,
      totalUsageCharges: parseFloat(stats.total_usage_charges) || 0
    };
  }

  static async findWithPagination(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = db(this.tableName)
      .join('users', 'usage.user_id', 'users.id')
      .select(
        'usage.*',
        'users.first_name',
        'users.last_name',
        'users.customer_id'
      );
    
    // Apply filters
    if (filters.user_id) {
      query = query.where('usage.user_id', filters.user_id);
    }
    
    if (filters.from_date) {
      query = query.where('usage.usage_date', '>=', filters.from_date);
    }
    
    if (filters.to_date) {
      query = query.where('usage.usage_date', '<=', filters.to_date);
    }
    
    if (filters.service_type) {
      query = query.where('usage.service_type', filters.service_type);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('users.customer_id', 'like', `%${filters.search}%`)
            .orWhere('users.first_name', 'like', `%${filters.search}%`)
            .orWhere('users.last_name', 'like', `%${filters.search}%`);
      });
    }
    
    const totalQuery = query.clone();
    const total = await totalQuery.count('usage.id as count').first();
    const usageRecords = await query
      .orderBy('usage.created_at', 'desc')
      .offset(offset)
      .limit(limit);
    
    return {
      usage: usageRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  static async getTopDataUsers(limit = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await db(this.tableName)
      .join('users', 'usage.user_id', 'users.id')
      .select(
        'users.id',
        'users.first_name',
        'users.last_name',
        'users.customer_id',
        db.raw('SUM(usage.data_used_mb) as total_data_mb')
      )
      .where('usage.usage_date', '>=', thirtyDaysAgo)
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.customer_id')
      .orderBy('total_data_mb', 'desc')
      .limit(limit);
  }

  static async getUsageByServiceType(userId, startDate, endDate) {
    return await db(this.tableName)
      .where('user_id', userId)
      .whereBetween('usage_date', [startDate, endDate])
      .select(
        'service_type',
        db.raw('SUM(data_used_mb) as total_data'),
        db.raw('SUM(voice_minutes) as total_voice'),
        db.raw('SUM(sms_count) as total_sms'),
        db.raw('SUM(data_charges + voice_charges + sms_charges) as total_charges')
      )
      .groupBy('service_type')
      .orderBy('total_charges', 'desc');
  }

  static async getHourlyUsagePattern(userId, date) {
    return await db(this.tableName)
      .where('user_id', userId)
      .whereRaw('DATE(usage_date) = ?', [date])
      .select(
        db.raw('HOUR(usage_date) as hour'),
        db.raw('SUM(data_used_mb) as data_mb'),
        db.raw('SUM(voice_minutes) as voice_min'),
        db.raw('SUM(sms_count) as sms_count')
      )
      .groupBy(db.raw('HOUR(usage_date)'))
      .orderBy('hour');
  }

  static async getCurrentMonthUsage(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await this.getUserUsageSummary(userId, startOfMonth, endOfMonth);
  }

  static async getUsageTrends(userId, months = 6) {
    return await db(this.tableName)
      .where('user_id', userId)
      .whereRaw('usage_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)', [months])
      .select(
        db.raw('YEAR(usage_date) as year'),
        db.raw('MONTH(usage_date) as month'),
        db.raw('SUM(data_used_mb) as monthly_data'),
        db.raw('SUM(voice_minutes) as monthly_voice'),
        db.raw('SUM(sms_count) as monthly_sms'),
        db.raw('SUM(data_charges + voice_charges + sms_charges) as monthly_charges')
      )
      .groupBy(db.raw('YEAR(usage_date), MONTH(usage_date)'))
      .orderBy('year')
      .orderBy('month');
  }

  static async recordUsage(userId, usageData) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if usage already exists for today
    const existingUsage = await db(this.tableName)
      .where('user_id', userId)
      .whereRaw('DATE(usage_date) = ?', [today])
      .where('service_type', usageData.service_type || 'general')
      .first();

    if (existingUsage) {
      // Update existing record
      return await this.update(existingUsage.id, {
        data_used_mb: (existingUsage.data_used_mb || 0) + (usageData.data_used_mb || 0),
        voice_minutes: (existingUsage.voice_minutes || 0) + (usageData.voice_minutes || 0),
        sms_count: (existingUsage.sms_count || 0) + (usageData.sms_count || 0),
        data_charges: (existingUsage.data_charges || 0) + (usageData.data_charges || 0),
        voice_charges: (existingUsage.voice_charges || 0) + (usageData.voice_charges || 0),
        sms_charges: (existingUsage.sms_charges || 0) + (usageData.sms_charges || 0)
      });
    } else {
      // Create new record
      return await this.create({
        user_id: userId,
        usage_date: new Date(),
        ...usageData
      });
    }
  }
}

module.exports = Usage;
