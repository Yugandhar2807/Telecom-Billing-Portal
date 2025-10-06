import axios from 'axios';
import { toast } from 'react-toastify';

// API base URL - will fallback to demo mode if backend is not available
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Demo mode flag
let isDemoMode = false;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and demo mode
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      // Network error - switch to demo mode
      isDemoMode = true;
      console.log('Backend not available, switching to demo mode');
      return Promise.reject(new Error('DEMO_MODE'));
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Demo data
const demoData = {
  user: {
    id: 1,
    first_name: 'Demo',
    last_name: 'User',
    email: 'demo@example.com',
    phone: '9876543210',
    customer_id: 'TB123456001',
    address: '123 Demo Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400001',
    country: 'India'
  },
  dashboard: {
    currentMonth: {
      totalSpent: 706.82,
      dataUsage: { used: 3.2, limit: 5.0, percentage: 64 },
      voiceUsage: { used: 150, limit: 0, percentage: 0 },
      smsUsage: { used: 45, limit: 0, percentage: 0 }
    },
    upcomingBills: [
      { invoice_number: 'INV-2024-003', amount: 706.82, due_date: '2024-04-10', status: 'pending' }
    ],
    recentPayments: [
      { transaction_id: 'TXN-20240301-001', amount: 706.82, date: '2024-03-01', status: 'completed' }
    ],
    alerts: [
      { type: 'usage', message: 'You have used 64% of your data limit', severity: 'warning' }
    ]
  },
  invoices: [
    {
      id: 1,
      invoice_number: 'INV-2024-001',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      due_date: '2024-02-10',
      subtotal: 699.00,
      tax_amount: 125.82,
      total_amount: 824.82,
      paid_amount: 824.82,
      status: 'paid',
      line_items: [
        { description: 'Premium Plan', amount: 699.00 }
      ]
    },
    {
      id: 2,
      invoice_number: 'INV-2024-002',
      billing_period_start: '2024-02-01',
      billing_period_end: '2024-02-29',
      due_date: '2024-03-10',
      subtotal: 699.00,
      tax_amount: 125.82,
      total_amount: 824.82,
      paid_amount: 824.82,
      outstanding_amount: 0,
      status: 'paid',
      line_items: [
        { description: 'Premium Plan', amount: 699.00 }
      ]
    }
  ],
  payments: [
    {
      id: 1,
      transaction_id: 'TXN-20240301-001',
      amount: 824.82,
      status: 'completed',
      payment_method: 'credit_card',
      payment_gateway: 'razorpay',
      processed_at: '2024-03-01T10:30:00Z',
      invoice_number: 'INV-2024-001'
    },
    {
      id: 2,
      transaction_id: 'TXN-20240215-002',
      amount: 824.82,
      status: 'completed',
      payment_method: 'upi',
      payment_gateway: 'razorpay',
      processed_at: '2024-02-15T14:45:00Z',
      invoice_number: 'INV-2024-002'
    }
  ],
  usage: {
    current: {
      data: { used: 3.2, limit: 5.0, unit: 'GB', percentage: 64 },
      voice: { used: 150, limit: 0, unit: 'minutes', percentage: 0 },
      sms: { used: 45, limit: 0, unit: 'messages', percentage: 0 }
    },
    analytics: {
      monthlyTrend: [
        { month: 'Jan', data: 4.2, voice: 180, sms: 65 },
        { month: 'Feb', data: 3.8, voice: 165, sms: 58 },
        { month: 'Mar', data: 3.2, voice: 150, sms: 45 }
      ]
    }
  }
};

// Helper function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Demo API functions
const demoAPI = {
  // Auth API
  login: async (credentials) => {
    await delay(500);
    if (credentials.email === 'demo@example.com' && credentials.password === 'password123') {
      return {
        data: {
          success: true,
          data: {
            user: demoData.user,
            token: 'demo-jwt-token-' + Date.now()
          }
        }
      };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  register: async (userData) => {
    await delay(500);
    return {
      data: {
        success: true,
        data: {
          user: { ...demoData.user, ...userData, id: Date.now() },
          token: 'demo-jwt-token-' + Date.now()
        }
      }
    };
  },

  getProfile: async () => {
    await delay(300);
    return {
      data: {
        success: true,
        data: demoData.user
      }
    };
  },

  updateProfile: async (userData) => {
    await delay(400);
    return {
      data: {
        success: true,
        data: { ...demoData.user, ...userData }
      }
    };
  },

  // Dashboard API
  getDashboard: async () => {
    await delay(800);
    return {
      data: {
        success: true,
        data: demoData.dashboard
      }
    };
  },

  // Invoices API
  getInvoices: async () => {
    await delay(500);
    return {
      data: {
        success: true,
        data: demoData.invoices
      }
    };
  },

  getInvoice: async (id) => {
    await delay(300);
    const invoice = demoData.invoices.find(inv => inv.id === parseInt(id));
    return {
      data: {
        success: true,
        data: invoice || demoData.invoices[0]
      }
    };
  },

  // Usage API
  getCurrentUsage: async () => {
    await delay(400);
    return {
      data: {
        success: true,
        data: demoData.usage.current
      }
    };
  },

  getUsageAnalytics: async () => {
    await delay(600);
    return {
      data: {
        success: true,
        data: demoData.usage.analytics
      }
    };
  },

  // Payments API
  getPayments: async () => {
    await delay(500);
    return {
      data: {
        success: true,
        data: demoData.payments
      }
    };
  },

  processPayment: async (paymentData) => {
    await delay(1500);
    const isSuccessful = Math.random() > 0.1; // 90% success rate
    
    if (isSuccessful) {
      return {
        data: {
          success: true,
          data: {
            id: Date.now(),
            transaction_id: 'TXN-' + Date.now(),
            amount: paymentData.amount,
            status: 'completed',
            payment_method: paymentData.payment_method || 'demo',
            processed_at: new Date().toISOString()
          }
        }
      };
    } else {
      throw new Error('Payment failed - Insufficient funds');
    }
  }
};

// Main API functions that handle both real API and demo mode
export const authAPI = {
  login: async (credentials) => {
    try {
      if (isDemoMode) {
        return await demoAPI.login(credentials);
      }
      return await api.post('/auth/login', credentials);
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.login(credentials);
      }
      throw error;
    }
  },

  register: async (userData) => {
    try {
      if (isDemoMode) {
        return await demoAPI.register(userData);
      }
      return await api.post('/auth/register', userData);
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.register(userData);
      }
      throw error;
    }
  },

  getProfile: async () => {
    try {
      if (isDemoMode) {
        return await demoAPI.getProfile();
      }
      return await api.get('/auth/me');
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getProfile();
      }
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      if (isDemoMode) {
        return await demoAPI.updateProfile(userData);
      }
      return await api.put('/auth/profile', userData);
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.updateProfile(userData);
      }
      throw error;
    }
  },
};

export const reportsAPI = {
  getDashboard: async () => {
    try {
      if (isDemoMode) {
        return await demoAPI.getDashboard();
      }
      return await api.get('/reports/dashboard');
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getDashboard();
      }
      throw error;
    }
  },
};

export const invoicesAPI = {
  getInvoices: async () => {
    try {
      if (isDemoMode) {
        return await demoAPI.getInvoices();
      }
      return await api.get('/invoices');
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getInvoices();
      }
      throw error;
    }
  },

  getInvoice: async (id) => {
    try {
      if (isDemoMode) {
        return await demoAPI.getInvoice(id);
      }
      return await api.get(`/invoices/${id}`);
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getInvoice(id);
      }
      throw error;
    }
  },
};

export const usageAPI = {
  getCurrentUsage: async () => {
    try {
      if (isDemoMode) {
        return await demoAPI.getCurrentUsage();
      }
      return await api.get('/usage');
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getCurrentUsage();
      }
      throw error;
    }
  },

  getUsageAnalytics: async () => {
    try {
      if (isDemoMode) {
        return await demoAPI.getUsageAnalytics();
      }
      return await api.get('/usage/analytics');
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getUsageAnalytics();
      }
      throw error;
    }
  },
};

export const paymentsAPI = {
  getPayments: async () => {
    try {
      if (isDemoMode) {
        return await demoAPI.getPayments();
      }
      return await api.get('/payments');
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.getPayments();
      }
      throw error;
    }
  },

  processPayment: async (paymentData) => {
    try {
      if (isDemoMode) {
        return await demoAPI.processPayment(paymentData);
      }
      return await api.post('/payments/process', paymentData);
    } catch (error) {
      if (error.message === 'DEMO_MODE') {
        return await demoAPI.processPayment(paymentData);
      }
      throw error;
    }
  },
};

export default api;
