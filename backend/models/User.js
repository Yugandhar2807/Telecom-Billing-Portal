const { db } = require('../utils/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static tableName = 'users';

  static async findAll() {
    return await db(this.tableName)
      .select('id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'customer_id', 'created_at')
      .orderBy('created_at', 'desc');
  }

  static async findById(id) {
    const user = await db(this.tableName).where({ id }).first();
    if (user) {
      delete user.password;
    }
    return user;
  }

  static async findByEmail(email) {
    return await db(this.tableName).where({ email }).first();
  }

  static async findByPhone(phone) {
    return await db(this.tableName).where({ phone }).first();
  }

  static async findByCustomerId(customer_id) {
    return await db(this.tableName).where({ customer_id }).first();
  }

  static async create(userData) {
    // Hash password
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Generate customer ID
    if (!userData.customer_id) {
      userData.customer_id = await this.generateCustomerId();
    }

    // Set default role and status
    userData.role = 'customer';
    userData.status = 'active';

    const [id] = await db(this.tableName).insert(userData);
    return await this.findById(id);
  }

  static async update(id, userData) {
    // Hash password if provided
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    userData.updated_at = new Date();

    await db(this.tableName).where({ id }).update(userData);
    
    return await this.findById(id);
  }

  static async delete(id) {
    return await db(this.tableName).where({ id }).del();
  }

  static async validatePassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  static async generateAuthToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  static async generateCustomerId() {
    const prefix = 'TB';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    let customerId = `${prefix}${timestamp}${random}`;
    
    // Ensure uniqueness
    const existing = await db(this.tableName).where({ customer_id: customerId }).first();
    if (existing) {
      customerId = `${prefix}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }
    
    return customerId;
  }

  static async updateLastLogin(id) {
    return await db(this.tableName)
      .where({ id })
      .update({ 
        last_login: new Date(),
        updated_at: new Date()
      });
  }

  static async findWithPagination(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = db(this.tableName).select(
      'id', 'first_name', 'last_name', 'email', 'phone', 'role', 'status', 'customer_id', 'created_at'
    );
    
    // Apply filters
    if (filters.role) {
      query = query.where('role', filters.role);
    }
    
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    
    if (filters.search) {
      query = query.where(function() {
        this.where('first_name', 'like', `%${filters.search}%`)
            .orWhere('last_name', 'like', `%${filters.search}%`)
            .orWhere('email', 'like', `%${filters.search}%`)
            .orWhere('customer_id', 'like', `%${filters.search}%`);
      });
    }
    
    const totalQuery = query.clone();
    const total = await totalQuery.count('id as count').first();
    const users = await query.orderBy('created_at', 'desc').offset(offset).limit(limit);
    
    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit)
      }
    };
  }

  static async getUserStats() {
    const stats = await db(this.tableName)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = "active" THEN 1 END) as active'),
        db.raw('COUNT(CASE WHEN status = "inactive" THEN 1 END) as inactive'),
        db.raw('COUNT(CASE WHEN status = "suspended" THEN 1 END) as suspended'),
        db.raw('COUNT(CASE WHEN role = "customer" THEN 1 END) as customers'),
        db.raw('COUNT(CASE WHEN role = "admin" THEN 1 END) as admins')
      )
      .first();

    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      inactive: parseInt(stats.inactive),
      suspended: parseInt(stats.suspended),
      customers: parseInt(stats.customers),
      admins: parseInt(stats.admins)
    };
  }

  static async changePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    return await db(this.tableName)
      .where({ id })
      .update({ 
        password: hashedPassword,
        updated_at: new Date()
      });
  }

  static async verifyEmail(id) {
    return await db(this.tableName)
      .where({ id })
      .update({ 
        email_verified: true,
        updated_at: new Date()
      });
  }

  static async verifyPhone(id) {
    return await db(this.tableName)
      .where({ id })
      .update({ 
        phone_verified: true,
        updated_at: new Date()
      });
  }

  static async updatePreferences(id, preferences) {
    return await db(this.tableName)
      .where({ id })
      .update({ 
        preferences: JSON.stringify(preferences),
        updated_at: new Date()
      });
  }
}

module.exports = User;
