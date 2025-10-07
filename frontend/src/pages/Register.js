import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const RegisterContainer = styled.div`
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #e0e7ff 0%, #c3dafe 100%); /* Softer, more inviting gradient */
`;

const RegisterCard = styled.div`
  background: white;
  border-radius: 16px; /* More rounded */
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15); /* Stronger, softer shadow */
  padding: 3rem;
  width: 100%;
  max-width: 500px;
  
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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

const LoginLink = styled.div`
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

const DemoNote = styled.div`
  background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
  border: 1px solid #81e6d9;
  border-radius: 10px; /* More rounded */
  padding: 1.2rem; /* More padding */
  margin-top: 2rem; /* More space */
  text-align: center;
`;

const DemoText = styled.p`
  color: #2d5a60;
  margin: 0;
  font-size: 0.9rem;
`;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await authAPI.register(registerData);
      const { user, token } = response.data.data;
      
      await login(user, token);
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Prevent flash of register form
  }

  return (
    <RegisterContainer>
      <RegisterCard>
        <Title>Create Account</Title>
        <Subtitle>Join TelecomBill Portal for transparent billing</Subtitle>
        
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Enter first name"
                className={errors.first_name ? 'error' : ''}
                {...register('first_name', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
              />
              {errors.first_name && (
                <ErrorMessage>{errors.first_name.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Enter last name"
                className={errors.last_name ? 'error' : ''}
                {...register('last_name', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
              />
              {errors.last_name && (
                <ErrorMessage>{errors.last_name.message}</ErrorMessage>
              )}
            </FormGroup>
          </FormRow>

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
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className={errors.phone ? 'error' : ''}
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Phone number must be 10 digits'
                }
              })}
            />
            {errors.phone && (
              <ErrorMessage>{errors.phone.message}</ErrorMessage>
            )}
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create password"
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

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                className={errors.confirmPassword ? 'error' : ''}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value =>
                    value === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <ErrorMessage>{errors.confirmPassword.message}</ErrorMessage>
              )}
            </FormGroup>
          </FormRow>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading && <LoadingSpinner />}<span style={{marginLeft: isLoading ? '0.5rem' : '0'}}>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
          </SubmitButton>
        </Form>

        <LoginLink>
          Already have an account?{' '}
          <StyledLink to="/login">Sign in here</StyledLink>
        </LoginLink>

        <DemoNote>
          <DemoText>
            🎯 Demo Mode: Registration creates a demo account for testing purposes
          </DemoText>
        </DemoNote>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;