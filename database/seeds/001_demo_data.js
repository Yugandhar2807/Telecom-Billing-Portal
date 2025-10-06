const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Delete all existing entries
  await knex('payments').del();
  await knex('usage').del();
  await knex('invoices').del();
  await knex('user_plans').del();
  await knex('plans').del();
  await knex('users').del();

  // Hash password for demo user
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Insert users
  await knex('users').insert([
    {
      id: 1,
      first_name: 'Demo',
      last_name: 'User',
      email: 'demo@example.com',
      phone: '9876543210',
      password: hashedPassword,
      role: 'customer',
      status: 'active',
      customer_id: 'TB123456001',
      address: '123 Demo Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      email_verified: true,
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@telecom.com',
      phone: '9876543211',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      customer_id: 'TB123456002',
      address: '456 Admin Avenue',
      city: 'Delhi',
      state: 'Delhi',
      postal_code: '110001',
      country: 'India',
      email_verified: true,
      phone_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Insert plans
  await knex('plans').insert([
    {
      id: 1,
      name: 'Basic Plan',
      description: 'Perfect for light users',
      type: 'prepaid',
      monthly_cost: 199.00,
      data_limit_gb: 1,
      voice_minutes: 100,
      sms_count: 100,
      international_calls: false,
      data_rollover: false,
      features: JSON.stringify(['Local calls', 'SMS', '1GB Data']),
      is_active: true,
      plan_code: 'BASIC_199',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      name: 'Standard Plan',
      description: 'Great value for regular users',
      type: 'prepaid',
      monthly_cost: 399.00,
      data_limit_gb: 2,
      voice_minutes: 200,
      sms_count: 200,
      international_calls: false,
      data_rollover: true,
      features: JSON.stringify(['Local calls', 'SMS', '2GB Data', 'Free incoming']),
      is_active: true,
      plan_code: 'STANDARD_399',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      name: 'Premium Plan',
      description: 'Unlimited everything',
      type: 'postpaid',
      monthly_cost: 699.00,
      data_limit_gb: 5,
      voice_minutes: 0,
      sms_count: 0,
      international_calls: true,
      data_rollover: true,
      features: JSON.stringify(['Unlimited calls', 'Unlimited SMS', '5GB Data', 'International roaming']),
      is_active: true,
      plan_code: 'PREMIUM_699',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Insert user plan subscription
  await knex('user_plans').insert([
    {
      id: 1,
      user_id: 1,
      plan_id: 3,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'active',
      monthly_cost: 699.00,
      auto_renewal: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Insert sample invoices
  await knex('invoices').insert([
    {
      id: 1,
      user_id: 1,
      invoice_number: 'INV-2024-001',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      due_date: '2024-02-10',
      subtotal: 699.00,
      tax_amount: 125.82,
      discount_amount: 0.00,
      total_amount: 824.82,
      paid_amount: 824.82,
      outstanding_amount: 0.00,
      status: 'paid',
      line_items: JSON.stringify([
        { description: 'Premium Plan', amount: 699.00, quantity: 1 }
      ]),
      usage_details: JSON.stringify({
        data_used: 4.2,
        data_limit: 5.0,
        voice_minutes: 180,
        sms_count: 65
      }),
      paid_at: '2024-01-15 10:30:00',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      user_id: 1,
      invoice_number: 'INV-2024-002',
      billing_period_start: '2024-02-01',
      billing_period_end: '2024-02-29',
      due_date: '2024-03-10',
      subtotal: 699.00,
      tax_amount: 125.82,
      discount_amount: 0.00,
      total_amount: 824.82,
      paid_amount: 824.82,
      outstanding_amount: 0.00,
      status: 'paid',
      line_items: JSON.stringify([
        { description: 'Premium Plan', amount: 699.00, quantity: 1 }
      ]),
      usage_details: JSON.stringify({
        data_used: 3.8,
        data_limit: 5.0,
        voice_minutes: 165,
        sms_count: 58
      }),
      paid_at: '2024-02-15 14:45:00',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      user_id: 1,
      invoice_number: 'INV-2024-003',
      billing_period_start: '2024-03-01',
      billing_period_end: '2024-03-31',
      due_date: '2024-04-10',
      subtotal: 699.00,
      tax_amount: 125.82,
      discount_amount: 0.00,
      total_amount: 824.82,
      paid_amount: 0.00,
      outstanding_amount: 824.82,
      status: 'sent',
      line_items: JSON.stringify([
        { description: 'Premium Plan', amount: 699.00, quantity: 1 }
      ]),
      usage_details: JSON.stringify({
        data_used: 3.2,
        data_limit: 5.0,
        voice_minutes: 150,
        sms_count: 45
      }),
      sent_at: '2024-03-01 09:00:00',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Insert sample usage data
  const usageData = [];
  const startDate = new Date('2024-03-01');
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Daily data usage (random between 0.1-0.3 GB)
    usageData.push({
      user_id: 1,
      usage_date: currentDate.toISOString().split('T')[0],
      usage_type: 'data',
      amount: (Math.random() * 0.2 + 0.1).toFixed(3),
      unit: 'GB',
      cost: 0.00,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Daily voice usage (random between 2-20 minutes)
    if (Math.random() > 0.3) { // Not every day
      usageData.push({
        user_id: 1,
        usage_date: currentDate.toISOString().split('T')[0],
        usage_type: 'voice',
        amount: Math.floor(Math.random() * 18 + 2),
        unit: 'minutes',
        cost: 0.00,
        destination: 'Local',
        duration_seconds: Math.floor(Math.random() * 1080 + 120),
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Daily SMS usage (random between 0-5)
    if (Math.random() > 0.5) { // Not every day
      usageData.push({
        user_id: 1,
        usage_date: currentDate.toISOString().split('T')[0],
        usage_type: 'sms',
        amount: Math.floor(Math.random() * 5),
        unit: 'count',
        cost: 0.00,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  await knex('usage').insert(usageData);

  // Insert sample payments
  await knex('payments').insert([
    {
      id: 1,
      user_id: 1,
      invoice_id: 1,
      transaction_id: 'TXN-20240115-001',
      payment_gateway: 'razorpay',
      gateway_transaction_id: 'pay_razorpay_123456',
      amount: 824.82,
      currency: 'INR',
      status: 'completed',
      payment_method: 'credit_card',
      payment_reference: 'REF-001',
      processed_at: '2024-01-15 10:30:00',
      gateway_fee: 16.50,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      user_id: 1,
      invoice_id: 2,
      transaction_id: 'TXN-20240215-002',
      payment_gateway: 'razorpay',
      gateway_transaction_id: 'pay_razorpay_789012',
      amount: 824.82,
      currency: 'INR',
      status: 'completed',
      payment_method: 'upi',
      payment_reference: 'REF-002',
      processed_at: '2024-02-15 14:45:00',
      gateway_fee: 8.25,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  console.log('✅ Demo data seeded successfully');
};
