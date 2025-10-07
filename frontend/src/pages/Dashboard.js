import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const WelcomeSection = styled.div`
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h1`
  color: #2d3748;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const WelcomeSubtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatTitle = styled.h3`
  color: #4a5568;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const StatIcon = styled.div`
  font-size: 1.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.5rem;
`;

const StatSubtext = styled.p`
  color: #718096;
  font-size: 0.9rem;
  margin: 0;
`;

const ProgressBar = styled.div`
  background: #e2e8f0;
  border-radius: 10px;
  height: 8px;
  margin-top: 1rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.percentage > 80) return 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
    if (props.percentage > 60) return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
    return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
  }};
  width: ${props => Math.min(props.percentage, 100)}%;
  transition: width 0.5s ease;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  transition: background 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: #edf2f7;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ItemTitle = styled.span`
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const ItemSubtitle = styled.span`
  color: #718096;
  font-size: 0.9rem;
`;

const ItemValue = styled.span`
  color: ${props => props.status === 'paid' || props.status === 'completed' ? '#38a169' : '#e53e3e'};
  font-weight: bold;
  font-size: 1.1rem;
`;

const AlertsSection = styled.div`
  margin-bottom: 2rem;
`;

const AlertCard = styled.div`
  background: ${props => {
    switch (props.severity) {
      case 'error': return 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)';
      case 'warning': return 'linear-gradient(135deg, #fefcbf 0%, #faf089 100%)';
      case 'info': return 'linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%)';
      default: return 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.severity) {
      case 'error': return '#f56565';
      case 'warning': return '#ed8936';
      case 'info': return '#4299e1';
      default: return '#48bb78';
    }
  }};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AlertIcon = styled.div`
  font-size: 1.25rem;
`;

const AlertText = styled.p`
  color: #2d3748;
  font-weight: 500;
  margin: 0;
  flex: 1;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const ModalInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled(Link)`
  flex: 1;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Dashboard = () => {
  const { payments, bills } = useAuth(); // Get payments and bills from context

  // Hardcoded dashboard data for demo purposes, to ensure dynamic updates work
  // In a real app, this would come from the backend API
  const currentMonthData = {
    totalSpent: 706.82,
    dataUsage: { used: 3.2, limit: 5.0, percentage: 64 },
    voiceUsage: { used: 150, limit: 0, percentage: 0 },
    smsUsage: { used: 45, limit: 0, percentage: 0 }
  };

  const alertsData = [
    { type: 'usage', message: 'You have used 64% of your data limit', severity: 'warning' }
  ];

  const [loading, setLoading] = useState(false); // Set to false as data is hardcoded
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const openModal = (data) => {
    setModalData(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const currentMonth = currentMonthData; // Use hardcoded data
  const alerts = alertsData; // Use hardcoded data

  // Filter bills for upcoming (due) and slice payments for recent
  const upcomingBills = bills.filter(bill => bill.status === 'Due');
  const recentPayments = payments.slice(0, 3); // Take top 3 recent payments

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>Dashboard</WelcomeTitle>
        <WelcomeSubtitle>Welcome back! Here's your billing overview</WelcomeSubtitle>
      </WelcomeSection>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <AlertsSection>
          {alerts.map((alert, index) => (
            <AlertCard key={index} severity={alert.severity}>
              <AlertIcon>
                {alert.severity === 'warning' ? '⚠️' : 
                 alert.severity === 'error' ? '❌' : 
                 alert.severity === 'info' ? 'ℹ️' : '✅'}
              </AlertIcon>
              <AlertText>{alert.message}</AlertText>
            </AlertCard>
          ))}
        </AlertsSection>
      )}

      {/* Usage Stats */}
      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Monthly Spending</StatTitle>
            <StatIcon>💰</StatIcon>
          </StatHeader>
          <StatValue>₹{currentMonth.totalSpent.toFixed(2)}</StatValue>
          <StatSubtext>Current billing cycle</StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Data Usage</StatTitle>
            <StatIcon>📊</StatIcon>
          </StatHeader>
          <StatValue>
            {currentMonth.dataUsage.used} GB
            {currentMonth.dataUsage.limit > 0 && (
              <span style={{ fontSize: '1rem', color: '#718096' }}>
                / {currentMonth.dataUsage.limit} GB
              </span>
            )}
          </StatValue>
          <StatSubtext>
            {currentMonth.dataUsage.limit > 0 
              ? `${currentMonth.dataUsage.percentage}% used` 
              : 'Unlimited'
            }
          </StatSubtext>
          {currentMonth.dataUsage.limit > 0 && (
            <ProgressBar>
              <ProgressFill percentage={currentMonth.dataUsage.percentage} />
            </ProgressBar>
          )}
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Voice Usage</StatTitle>
            <StatIcon>📞</StatIcon>
          </StatHeader>
          <StatValue>
            {currentMonth.voiceUsage.used} min
          </StatValue>
          <StatSubtext>
            {currentMonth.voiceUsage.limit === 0 ? 'Unlimited calls' : `${currentMonth.voiceUsage.used}/${currentMonth.voiceUsage.limit} minutes`}
          </StatSubtext>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>SMS Usage</StatTitle>
            <StatIcon>💬</StatIcon>
          </StatHeader>
          <StatValue>
            {currentMonth.smsUsage.used} SMS
          </StatValue>
          <StatSubtext>
            {currentMonth.smsUsage.limit === 0 ? 'Unlimited messages' : `${currentMonth.smsUsage.used}/${currentMonth.smsUsage.limit} messages`}
          </StatSubtext>
        </StatCard>
      </StatsGrid>

      {/* Bills and Payments */}
      <ContentGrid>
        <SectionCard>
          <SectionTitle>📋 Upcoming Bills</SectionTitle>
          <ItemList>
            {upcomingBills && upcomingBills.length > 0 ? (
              upcomingBills.map((bill, index) => (
                <Item key={index} onClick={() => openModal({ type: 'bill', ...bill })}>
                  <ItemInfo>
                    <ItemTitle>{bill.invoiceNumber}</ItemTitle>
                    <ItemSubtitle>Due: {new Date(bill.dueDate).toLocaleDateString()}</ItemSubtitle>
                  </ItemInfo>
                  <ItemValue status={bill.status}>₹{bill.amount.toFixed(2)}</ItemValue>
                </Item>
              ))
            ) : (
              <p>No upcoming bills.</p>
            )}
          </ItemList>
        </SectionCard>

        <SectionCard>
          <SectionTitle>💳 Recent Payments</SectionTitle>
          <ItemList>
            {recentPayments && recentPayments.length > 0 ? (
              recentPayments.map((payment, index) => (
                <Item key={index} onClick={() => openModal({ type: 'payment', ...payment })}>
                  <ItemInfo>
                    <ItemTitle>{payment.id}</ItemTitle> 
                    <ItemSubtitle>{new Date(payment.date).toLocaleDateString()}</ItemSubtitle> 
                  </ItemInfo>
                  <ItemValue status={payment.status}>₹{payment.amount.toFixed(2)}</ItemValue>
                </Item>
              ))
            ) : (
              <p>No recent payments.</p>
            )}
          </ItemList>
        </SectionCard>
      </ContentGrid>

      {/* Quick Actions */}
      <QuickActions>
        <ActionButton to="/bills">View All Bills</ActionButton>
        <ActionButton to="/usage">Usage Details</ActionButton>
        <ActionButton to="/payments">Make Payment</ActionButton>
      </QuickActions>

      {isModalOpen && modalData && (
        <ModalBackdrop onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            {modalData.type === 'bill' && (
              <>
                <ModalTitle>Bill Details</ModalTitle>
                <ModalInfoRow><span>Invoice #:</span> <strong>{modalData.invoiceNumber}</strong></ModalInfoRow>
                <ModalInfoRow><span>Amount:</span> <strong>₹{modalData.amount.toFixed(2)}</strong></ModalInfoRow>
                <ModalInfoRow><span>Due Date:</span> <strong>{new Date(modalData.dueDate).toLocaleDateString()}</strong></ModalInfoRow>
                <ModalInfoRow><span>Status:</span> <strong>{modalData.status}</strong></ModalInfoRow>
              </>
            )}
            {modalData.type === 'payment' && (
              <>
                <ModalTitle>Payment Details</ModalTitle>
                <ModalInfoRow><span>Transaction ID:</span> <strong>{modalData.id}</strong></ModalInfoRow>
                <ModalInfoRow><span>Amount:</span> <strong>₹{modalData.amount.toFixed(2)}</strong></ModalInfoRow>
                <ModalInfoRow><span>Date:</span> <strong>{new Date(modalData.date).toLocaleDateString()}</strong></ModalInfoRow>
                <ModalInfoRow><span>Status:</span> <strong>{modalData.status}</strong></ModalInfoRow>
              </>
            )}
            <button onClick={closeModal} style={{ marginTop: '1rem' }}>Close</button>
          </ModalContent>
        </ModalBackdrop>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;