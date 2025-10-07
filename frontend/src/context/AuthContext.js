import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';

// Auth context
const AuthContext = createContext();

// Initial data for payments
const initialPayments = [
  {
    id: 'TXN789012',
    date: '2024-02-15',
    amount: 824.82,
    method: 'UPI',
    status: 'Completed'
  },
  {
    id: 'TXN123456',
    date: '2024-01-15',
    amount: 799.50,
    method: 'Credit Card',
    status: 'Completed'
  }
];

// Initial data for bills
const initialBills = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-003',
    billingPeriod: 'Mar 1, 2024 - Mar 31, 2024',
    dueDate: 'Apr 10, 2024',
    amount: 824.82,
    status: 'Due'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    billingPeriod: 'Feb 1, 2024 - Feb 29, 2024',
    dueDate: 'Mar 10, 2024',
    amount: 824.82,
    status: 'Paid'
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-001',
    billingPeriod: 'Jan 1, 2024 - Jan 31, 2024',
    dueDate: 'Feb 10, 2024',
    amount: 799.50,
    status: 'Paid'
  },
  {
    id: 4,
    invoiceNumber: 'INV-2023-012',
    billingPeriod: 'Dec 1, 2023 - Dec 31, 2023',
    dueDate: 'Jan 10, 2024',
    amount: 750.00,
    status: 'Paid'
  }
];

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  payments: initialPayments,
  bills: initialBills,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'ADD_PAYMENT':
      return {
        ...state,
        payments: [action.payload, ...state.payments],
      };
    case 'UPDATE_BILL_STATUS':
      return {
        ...state,
        bills: state.bills.map(bill =>
          bill.id === action.payload.billId ? { ...bill, status: action.payload.newStatus } : bill
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          dispatch({
            type: 'INIT_AUTH',
            payload: { user, token },
          });
        } else {
          dispatch({
            type: 'INIT_AUTH',
            payload: { user: null, token: null },
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({
          type: 'INIT_AUTH',
          payload: { user: null, token: null },
        });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (userData, token) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData, token },
      });
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error('Login failed');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Update user function
  const updateUser = (userData) => {
    try {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({
        type: 'UPDATE_USER',
        payload: userData,
      });
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  };

  // Add payment function
  const addPayment = (paymentData) => {
    dispatch({
      type: 'ADD_PAYMENT',
      payload: paymentData,
    });
  };

  // Update bill status function
  const updateBillStatus = (billId, newStatus) => {
    dispatch({
      type: 'UPDATE_BILL_STATUS',
      payload: { billId, newStatus },
    });
  };

  // Set loading
  const setLoading = (loading) => {
    dispatch({
      type: 'SET_LOADING',
      payload: loading,
    });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    addPayment,
    updateBillStatus,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
