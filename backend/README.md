# Telecom Billing Portal - Backend API

This is the backend API for the Telecom Billing Portal, built with Node.js, Express, and MySQL.

## Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **Customer Management**: Full CRUD operations for customer accounts
- **Plan Management**: Telecom billing plans (prepaid/postpaid)
- **Invoice Management**: Automated billing and invoice generation
- **Payment Processing**: Multiple payment gateway support (Razorpay, Stripe, PayPal)
- **Usage Tracking**: Real-time usage monitoring and reporting
- **Reporting & Analytics**: Comprehensive billing and usage reports
- **Security**: Rate limiting, input validation, and secure headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Knex.js ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Payment Gateways**: Razorpay, Stripe, PayPal
- **File Processing**: PDFKit, ExcelJS
- **Email**: Nodemailer
- **Scheduling**: Node-cron

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Set up the database:
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE telecom_billing;
   exit

   # Run migrations
   npm run migrate

   # Seed initial data (optional)
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## Environment Variables

### Required Configuration

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=telecom_billing
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Optional Configuration

```env
# Payment Gateways
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### API Endpoints

#### Authentication (`/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| GET | `/auth/me` | Get current user profile | Private |
| PUT | `/auth/profile` | Update user profile | Private |
| POST | `/auth/change-password` | Change password | Private |
| POST | `/auth/logout` | User logout | Private |

#### Users (`/users`) - Admin Only

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get all users (paginated) | Admin |
| GET | `/users/:id` | Get user by ID | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/stats` | Get user statistics | Admin |

#### Plans (`/plans`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/plans` | Get all plans (paginated) | Private |
| GET | `/plans/:id` | Get plan by ID | Private |
| POST | `/plans` | Create new plan | Admin |
| PUT | `/plans/:id` | Update plan | Admin |
| DELETE | `/plans/:id` | Delete plan | Admin |
| GET | `/plans/stats/overview` | Get plan statistics | Admin |
| GET | `/plans/popular/list` | Get popular plans | Private |

#### Invoices (`/invoices`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/invoices` | Get invoices (paginated) | Private |
| GET | `/invoices/:id` | Get invoice by ID | Private |
| GET | `/invoices/number/:invoiceNumber` | Get invoice by number | Private |
| POST | `/invoices` | Create new invoice | Admin |
| PUT | `/invoices/:id` | Update invoice | Admin |
| POST | `/invoices/:id/pay` | Mark invoice as paid | Private |
| GET | `/invoices/overdue/list` | Get overdue invoices | Admin |
| GET | `/invoices/stats/overview` | Get invoice statistics | Admin |
| GET | `/invoices/revenue/monthly` | Get monthly revenue | Admin |
| GET | `/invoices/my/summary` | Get user invoice summary | Private |

#### Payments (`/payments`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/payments` | Get payments (paginated) | Private |
| GET | `/payments/:id` | Get payment by ID | Private |
| POST | `/payments` | Create new payment | Private |
| PUT | `/payments/:id` | Update payment | Admin |
| POST | `/payments/:id/complete` | Mark payment completed | Admin |
| POST | `/payments/:id/fail` | Mark payment failed | Admin |
| GET | `/payments/stats/overview` | Get payment statistics | Admin |
| GET | `/payments/revenue/monthly` | Get monthly payment revenue | Admin |
| GET | `/payments/revenue/by-method` | Get revenue by method | Admin |
| GET | `/payments/my/summary` | Get user payment summary | Private |
| GET | `/payments/recent/list` | Get recent payments | Admin |

#### Usage (`/usage`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/usage` | Get usage records (paginated) | Private |
| GET | `/usage/:id` | Get usage record by ID | Private |
| POST | `/usage` | Create usage record | Admin |
| POST | `/usage/record` | Record usage for current user | Private |
| PUT | `/usage/:id` | Update usage record | Admin |
| DELETE | `/usage/:id` | Delete usage record | Admin |
| GET | `/usage/my/summary` | Get user usage summary | Private |
| GET | `/usage/my/current-month` | Get current month usage | Private |
| GET | `/usage/my/trends` | Get usage trends | Private |
| GET | `/usage/my/daily` | Get daily usage | Private |
| GET | `/usage/my/monthly` | Get monthly usage breakdown | Private |
| GET | `/usage/my/hourly` | Get hourly usage pattern | Private |
| GET | `/usage/stats/overview` | Get usage statistics | Admin |
| GET | `/usage/stats/top-users` | Get top data users | Admin |
| GET | `/usage/my/by-service` | Get usage by service type | Private |

#### Reports (`/reports`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reports/dashboard` | Get dashboard data | Private |
| GET | `/reports/spending` | Get spending report | Private |
| GET | `/reports/usage` | Get usage report | Private |
| GET | `/reports/billing` | Get billing report | Admin |

### Request/Response Examples

#### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+919876543210",
  "password": "password123"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

#### Create Payment
```bash
POST /api/v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500.00,
  "method": "credit_card",
  "invoice_id": 123,
  "gateway": "razorpay"
}
```

#### Get Usage Summary
```bash
GET /api/v1/usage/my/summary?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

### Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

Error Response Format:
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Rate Limiting

API endpoints are rate-limited:
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

### Security Features

1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing protection
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: All inputs validated
5. **JWT Authentication**: Secure token-based auth
6. **Password Hashing**: bcrypt for password security
7. **SQL Injection Protection**: Parameterized queries

## Database Schema

### Users Table
- `id` - Primary key
- `first_name` - User's first name
- `last_name` - User's last name
- `email` - Unique email address
- `phone` - Unique phone number
- `password` - Hashed password
- `role` - User role (customer, admin, support)
- `status` - Account status (active, inactive, suspended)
- `customer_id` - Unique customer identifier
- `created_at`, `updated_at` - Timestamps

### Plans Table
- `id` - Primary key
- `name` - Plan name
- `description` - Plan description
- `type` - Plan type (prepaid, postpaid)
- `monthly_price` - Monthly cost
- `data_limit_gb` - Data allowance in GB
- `voice_minutes` - Voice allowance in minutes
- `sms_count` - SMS allowance
- `validity_days` - Plan validity period
- `features` - JSON array of features
- `status` - Plan status (active, inactive)
- `created_at`, `updated_at` - Timestamps

### Invoices Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `invoice_number` - Unique invoice number
- `billing_period_start` - Billing period start date
- `billing_period_end` - Billing period end date
- `due_date` - Payment due date
- `subtotal` - Invoice subtotal
- `tax_amount` - Tax amount
- `discount_amount` - Discount applied
- `total_amount` - Total invoice amount
- `paid_amount` - Amount paid
- `outstanding_amount` - Amount outstanding
- `status` - Invoice status (draft, sent, paid, overdue, cancelled)
- `line_items` - JSON array of line items
- `usage_details` - JSON usage breakdown
- `created_at`, `updated_at` - Timestamps

### Payments Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `invoice_id` - Foreign key to invoices (optional)
- `transaction_id` - Unique transaction ID
- `gateway_transaction_id` - Gateway transaction ID
- `amount` - Payment amount
- `currency` - Payment currency (default: INR)
- `method` - Payment method
- `gateway` - Payment gateway used
- `status` - Payment status
- `gateway_response` - JSON gateway response
- `processed_at` - Processing timestamp
- `created_at`, `updated_at` - Timestamps

### Usage Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `usage_date` - Usage date
- `service_type` - Service type (voice, data, sms, general)
- `data_used_mb` - Data used in MB
- `voice_minutes` - Voice minutes used
- `sms_count` - SMS count
- `data_charges` - Data charges
- `voice_charges` - Voice charges
- `sms_charges` - SMS charges
- `location` - Usage location (optional)
- `created_at`, `updated_at` - Timestamps

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run migrate:rollback` - Rollback last migration
- `npm run migrate:latest` - Run pending migrations

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure proper database credentials
4. Set up SSL/TLS
5. Configure production CORS origins
6. Set up proper logging
7. Configure payment gateway production keys
8. Set up database backups
9. Configure monitoring and alerts
10. Set up reverse proxy (nginx)

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## Support

For support, email support@telecom-billing.com or create an issue in the repository.

## License

MIT License - see LICENSE file for details.
