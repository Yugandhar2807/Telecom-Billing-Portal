# API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

### User Profile

#### GET /users/profile
Get current user profile (Protected).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "planId": 2,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Bills & Invoices

#### GET /bills
Get user's bills (Protected).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Bill status (paid, pending, overdue)

**Response:**
```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": 1,
        "billNumber": "BILL-2023-001",
        "billDate": "2023-01-01",
        "dueDate": "2023-01-15",
        "amount": 599.00,
        "status": "paid",
        "breakdown": {
          "basePlan": 499.00,
          "addOns": 50.00,
          "taxes": 50.00,
          "discounts": 0.00
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

#### GET /bills/:id
Get specific bill details (Protected).

#### POST /bills/:id/download
Download bill as PDF or Excel (Protected).

**Request Body:**
```json
{
  "format": "pdf" // or "excel"
}
```

### Usage Tracking

#### GET /usage/current
Get current month usage (Protected).

**Response:**
```json
{
  "success": true,
  "data": {
    "data": {
      "used": 2.5,
      "limit": 10.0,
      "unit": "GB"
    },
    "voice": {
      "used": 120,
      "limit": 1000,
      "unit": "minutes"
    },
    "sms": {
      "used": 45,
      "limit": 100,
      "unit": "messages"
    }
  }
}
```

#### GET /usage/history
Get usage history (Protected).

**Query Parameters:**
- `period` (optional): monthly, weekly, daily (default: monthly)
- `limit` (optional): Number of periods (default: 12)

### Payments

#### POST /payments/create-order
Create payment order (Protected).

**Request Body:**
```json
{
  "billId": 1,
  "paymentMethod": "razorpay" // or "stripe", "paypal"
}
```

#### POST /payments/verify
Verify payment (Protected).

**Request Body:**
```json
{
  "orderId": "order_123",
  "paymentId": "payment_123",
  "signature": "signature_hash"
}
```

### Dashboard & Reports

#### GET /dashboard/summary
Get dashboard summary (Protected).

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBill": {
      "amount": 599.00,
      "dueDate": "2023-02-15",
      "status": "pending"
    },
    "usage": {
      "data": { "used": 2.5, "limit": 10.0, "percentage": 25 },
      "voice": { "used": 120, "limit": 1000, "percentage": 12 },
      "sms": { "used": 45, "limit": 100, "percentage": 45 }
    },
    "alerts": [
      {
        "type": "usage_warning",
        "message": "SMS usage is at 45% of your limit"
      }
    ]
  }
}
```

#### GET /reports/spending
Get spending analysis (Protected).

#### GET /reports/usage-trends
Get usage trend analysis (Protected).

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- File download endpoints: 10 requests per minute
