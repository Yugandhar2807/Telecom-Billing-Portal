exports.up = function(knex) {
  return knex.schema.createTable('usage', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.date('usage_date').notNullable();
    table.enum('usage_type', ['data', 'voice', 'sms', 'international']).notNullable();
    table.decimal('amount', 12, 4).notNullable(); // Usage amount (MB, minutes, count)
    table.string('unit', 10).notNullable(); // MB, minutes, count
    table.decimal('cost', 10, 4).defaultTo(0); // Cost for this usage
    table.string('destination', 100); // For voice calls and SMS
    table.timestamp('start_time');
    table.integer('duration_seconds'); // For voice calls
    table.string('session_id', 100); // For data sessions
    table.text('details'); // Additional usage details
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id', 'usage_date']);
    table.index(['usage_type', 'usage_date']);
    table.index('usage_date');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('usage');
};
