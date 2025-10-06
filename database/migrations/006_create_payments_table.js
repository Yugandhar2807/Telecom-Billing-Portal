exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('invoice_id').unsigned();
    table.string('transaction_id', 100).notNullable().unique();
    table.string('payment_gateway', 50).notNullable(); // razorpay, stripe, paypal, etc.
    table.string('gateway_transaction_id', 100);
    table.decimal('amount', 12, 2).notNullable();
    table.enum('currency', ['INR', 'USD', 'EUR']).defaultTo('INR');
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded']).defaultTo('pending');
    table.enum('payment_method', ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']).notNullable();
    table.string('payment_reference', 100);
    table.json('gateway_response'); // Store gateway response
    table.text('failure_reason');
    table.timestamp('processed_at');
    table.decimal('gateway_fee', 8, 2).defaultTo(0);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('invoice_id').references('id').inTable('invoices').onDelete('SET NULL');
    
    // Indexes
    table.index(['user_id', 'status']);
    table.index('transaction_id');
    table.index(['status', 'processed_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
