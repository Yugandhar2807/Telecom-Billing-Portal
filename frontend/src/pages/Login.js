import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const LoginContainer = styled.div`
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #c3dafe 100%); /* Softer, more inviting gradient */
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 16px; /* More rounded */
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15); /* Stronger, softer shadow */
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  
  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const Title = styled.h2`
  color: #2d3748;
  font-size: 2.2rem; /* Slightly larger */
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #718096;
  text-align: center;
  margin-bottom: 2.5rem; /* More space */
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #4a5568;
  font-weight: 600; /* Bolder label */
  margin-bottom: 0.6rem; /* More space */
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 0.85rem; /* More padding */
  border: 2px solid #e2e8f0;
  border-radius: 10px; /* More rounded */
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2); /* Stronger glow */
  }
  
  &.error {
    border-color: #e53e3e;
  }
`;

const ErrorMessage = styled.span`
  color: #e53e3e;
  font-size: 0.85rem; /* Slightly larger */
  margin-top: 0.4rem; /* More space */
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%); /* New gradient */
  color: white;
  border: none;
  padding: 0.95rem; /* More padding */
  border-radius: 10px; /* More rounded */
  font-size: 1.05rem; /* Slightly larger font */
  font-weight: 700; /* Bolder */
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px); /* More pronounced lift */
    box-shadow: 0 8px 20px rgba(76, 81, 191, 0.4); /* Stronger shadow */
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 2rem; /* More space */
  color: #718096;
`;

const StyledLink = styled(Link)`
  color: #4c51bf; /* Match new primary color */
  text-decoration: none;
  font-weight: 600; /* Bolder */
  
  &:hover {
    text-decoration: underline;
  }
`;

const DemoCredentials = styled.div`
  background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
  border: 1px solid #81e6d9;
  border-radius: 10px; /* More rounded */
  padding: 1.2rem; /* More padding */
  margin-top: 2rem; /* More space */
`;

const DemoTitle = styled.h4`
  color: #234e52;
  margin: 0 0 0.6rem; /* More space */
  font-size: 0.95rem;
`;

const DemoInfo = styled.p`
  color: #2d5a60;
  margin: 0.3rem 0; /* More space */
  font-size: 0.88rem;
`;

const QuickFillButton = styled.button`
  background: #38b2ac;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem; /* More padding */
  border-radius: 8px; /* More rounded */
  font-size: 0.85rem;
  cursor: pointer;
  margin-top: 0.8rem; /* More space */
  transition: background 0.3s ease;
  
  &:hover {
    background: #319795;
  }
`;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(data);
      const { user, token } = response.data.data;
      
      await login(user, token);
      
      // Redirect to intended page or dashboard
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'demo@example.com');
    setValue('password', 'password123');
  };

  if (isAuthenticated) {
    return null; // Prevent flash of login form
  }

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Welcome Back</Title>
        <Subtitle>Sign in to your telecom billing account</Subtitle>
        
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <ErrorMessage>{errors.email.message}</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            {errors.password && (
              <ErrorMessage>{errors.password.message}</ErrorMessage>
            )}
          </FormGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading && <LoadingSpinner />}<span style={{marginLeft: isLoading ? '0.5rem' : '0'}}>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </SubmitButton>
        </Form>

        <RegisterLink>
          Don't have an account?{' '}
          <StyledLink to="/register">Create one here</StyledLink>
        </RegisterLink>

        <DemoCredentials>
          <DemoTitle>🎯 Demo Account</DemoTitle>
          <DemoInfo><strong>Email:</strong> demo@example.com</DemoInfo>
          <DemoInfo><strong>Password:</strong> password123</DemoInfo>
          <QuickFillButton onClick={fillDemoCredentials}>
            Fill Demo Credentials
          </QuickFillButton>
        </DemoCredentials>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
