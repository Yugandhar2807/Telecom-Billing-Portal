exports.up = function(knex) {
  return knex.schema.createTable('invoices', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('invoice_number', 50).notNullable().unique();
    table.date('billing_period_start').notNullable();
    table.date('billing_period_end').notNullable();
    table.date('due_date').notNullable();
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table.decimal('paid_amount', 12, 2).defaultTo(0);
    table.decimal('outstanding_amount', 12, 2).notNullable();
    table.enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).defaultTo('draft');
    table.json('line_items'); // Detailed breakdown of charges
    table.json('usage_details'); // Data, voice, SMS usage
    table.text('notes');
    table.timestamp('sent_at');
    table.timestamp('paid_at');
    table.string('payment_reference', 100);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id', 'status']);
    table.index(['billing_period_start', 'billing_period_end']);
    table.index('invoice_number');
    table.index('due_date');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('invoices');
};
