exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('first_name', 50).notNullable();
    table.string('last_name', 50).notNullable();
    table.string('email', 100).notNullable().unique();
    table.string('phone', 15).notNullable().unique();
    table.string('password', 255).notNullable();
    table.enum('role', ['customer', 'admin', 'support']).defaultTo('customer');
    table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
    table.text('address');
    table.string('city', 50);
    table.string('state', 50);
    table.string('postal_code', 10);
    table.string('country', 50).defaultTo('India');
    table.date('date_of_birth');
    table.string('customer_id', 20).unique();
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.timestamp('last_login');
    table.json('preferences');
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('customer_id');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
