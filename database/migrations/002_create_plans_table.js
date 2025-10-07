exports.up = function(knex) {
  return knex.schema.createTable('plans', function(table) {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.text('description');
    table.enum('type', ['prepaid', 'postpaid']).notNullable();
    table.decimal('monthly_cost', 10, 2).notNullable();
    table.integer('data_limit_gb').defaultTo(0); // 0 = unlimited
    table.integer('voice_minutes').defaultTo(0); // 0 = unlimited
    table.integer('sms_count').defaultTo(0); // 0 = unlimited
    table.boolean('international_calls').defaultTo(false);
    table.boolean('data_rollover').defaultTo(false);
    table.json('features'); // Additional features as JSON
    table.decimal('setup_fee', 8, 2).defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.integer('validity_days').defaultTo(30);
    table.string('plan_code', 20).unique();
    table.timestamps(true, true);
    
    // Indexes
    table.index('type');
    table.index('is_active');
    table.index('plan_code');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('plans');
};
