exports.up = function(knex) {
  return knex.schema.createTable('user_plans', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('plan_id').unsigned().notNullable();
    table.date('start_date').notNullable();
    table.date('end_date');
    table.enum('status', ['active', 'inactive', 'suspended', 'expired']).defaultTo('active');
    table.decimal('monthly_cost', 10, 2).notNullable();
    table.json('custom_features'); // Any plan customizations
    table.boolean('auto_renewal').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('plan_id').references('id').inTable('plans').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id', 'status']);
    table.index('start_date');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_plans');
};
