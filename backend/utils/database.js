const knex = require('knex');
const config = require('../knexfile.js');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  try {
    const dbConfig = config[environment];
    const dbName = dbConfig.connection.database;
    
    // Connect without specifying database
    const tempConfig = {
      ...dbConfig,
      connection: {
        ...dbConfig.connection,
        database: undefined
      }
    };
    
    const tempDb = knex(tempConfig);
    
    try {
      // Create database if it doesn't exist
      await tempDb.raw(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Database '${dbName}' is ready`);
    } catch (createError) {
      console.log(`Database '${dbName}' already exists or created successfully`);
    } finally {
      await tempDb.destroy();
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    return false;
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');
    
    // Create database if it doesn't exist
    await createDatabaseIfNotExists();
    
    // Test connection
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Database initialization complete');
      return true;
    } else {
      throw new Error('Database connection failed. Please check your database credentials in .env file.');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    return false;
  }
};

// Close database connection
const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

// Health check
const healthCheck = async () => {
  try {
    await db.raw('SELECT 1 as health');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

module.exports = {
  db,
  testConnection,
  createDatabaseIfNotExists,
  initializeDatabase,
  closeConnection,
  healthCheck
};
