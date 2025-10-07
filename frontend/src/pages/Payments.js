import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  color: #2d3748;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
  margin-bottom: 3rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const PaymentFormCard = styled.div`
  background: white;
  border-radius: 16px; /* More rounded */
  padding: 2.5rem; /* More padding */
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15); /* Stronger, softer shadow */
  border: 1px solid #e2e8f0;
`;

const HistoryCard = styled.div`
  background: white;
  border-radius: 16px; /* More rounded */
  padding: 2.5rem; /* More padding */
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15); /* Stronger, softer shadow */
  border: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  color: #2d3748;
  font-size: 1.35rem; /* Slightly larger */
  font-weight: bold;
  margin-bottom: 1.8rem; /* More space */
  border-bottom: 2px solid #edf2f7; /* Lighter border */
  padding-bottom: 0.8rem; /* More padding */
`;

const FormGroup = styled.div`
  margin-bottom: 1.2rem; /* More space */
`;

const Label = styled.label`
  display: block;
  color: #4a5568;
  font-weight: 600; /* Bolder label */
  margin-bottom: 0.6rem; /* More space */
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem; /* More padding */
  border: 2px solid #cbd5e0; /* Softer border */
  border-radius: 10px; /* More rounded */
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2); /* Stronger glow */
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%); /* New gradient */
  color: white;
  border: none;
  padding: 0.95rem; /* More padding */
  border-radius: 10px; /* More rounded */
  font-size: 1.05rem; /* Slightly larger font */
  font-weight: 700; /* Bolder */
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem; /* More space */

  &:hover {
    transform: translateY(-2px); /* More pronounced lift */
    box-shadow: 0 8px 20px rgba(76, 81, 191, 0.4); /* Stronger shadow */
  }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: separate; /* Use separate for border-spacing */
  border-spacing: 0 0.5rem; /* Add vertical spacing between rows */
`;

const Th = styled.th`
  background-color: #edf2f7; /* Lighter header background */
  padding: 0.9rem 1.2rem; /* More padding */
  text-align: left;
  font-size: 0.9rem; /* Slightly larger */
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;

  &:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const Td = styled.td`
  padding: 1rem 1.2rem; /* More padding */
  border-bottom: 1px solid #e2e8f0;
  color: #2d3748;
  background-color: white; /* Ensure background for spacing */

  &:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }
  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

const PaymentMethodTabs = styled.div`
  display: flex;
  margin-bottom: 2rem; /* More space */
  border-bottom: 2px solid #edf2f7; /* Lighter border */
`;

const TabButton = styled.button`
  padding: 0.8rem 1.8rem; /* More padding */
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1.05rem; /* Slightly larger */
  font-weight: 600;
  color: ${props => props.active ? '#4c51bf' : '#718096'}; /* Match new primary color */
  border-bottom: 3px solid ${props => props.active ? '#4c51bf' : 'transparent'}; /* Match new primary color */
  margin-bottom: -2px;
  transition: all 0.3s ease;

  &:hover {
    color: #4c51bf; /* Highlight on hover */
  }
`;

const Payments = () => {
  const [amount, setAmount] = useState('824.82');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const { payments, addPayment, bills, updateBillStatus } = useAuth();

  const processPaymentAndBill = (method) => {
    const newPayment = {
      id: `TXN${Math.floor(Math.random() * 1000000)}`,
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(amount) || 0,
      method: method,
      status: 'Completed'
    };
    addPayment(newPayment);

    // Find a 'Due' bill and mark it as 'Paid'
    const dueBill = bills.find(bill => bill.status === 'Due');
    if (dueBill) {
      updateBillStatus(dueBill.id, 'Paid');
      console.log(`Bill ${dueBill.invoiceNumber} marked as Paid.`);
    } else {
      console.log('No "Due" bills found to mark as Paid.');
    }
  };

  const handleUpiPayment = (e) => {
    e.preventDefault();
    processPaymentAndBill('UPI');
    const upiUrl = `upi://pay?pa=demouser@okbank&pn=Telecom%20Bill%20Portal&am=${amount}&cu=INR&tn=BillPayment`;
    window.location.href = upiUrl;
    alert('Payment added to history and a bill marked as paid. Attempting to open UPI app...');
  };

  const handleCardPayment = (e) => {
    e.preventDefault();
    processPaymentAndBill('Card');
    alert(`Payment of ₹${amount} successful with your card! It has been added to your history and a bill marked as paid.`);
  };

  return (
    <PageContainer>
      <PageTitle>💳 Payments</PageTitle>
      <PageSubtitle>
        Securely pay your bills and view your transaction history.
      </PageSubtitle>

      <ContentGrid>
        <PaymentFormCard>
          <SectionTitle>Pay Outstanding Bill</SectionTitle>
          <PaymentMethodTabs>
            <TabButton active={paymentMethod === 'Card'} onClick={() => setPaymentMethod('Card')}>Card</TabButton>
            <TabButton active={paymentMethod === 'UPI'} onClick={() => setPaymentMethod('UPI')}>UPI</TabButton>
          </PaymentMethodTabs>

          <FormGroup>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input 
              id="amount" 
              type="number" 
              placeholder="e.g., 824.82" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormGroup>

          {paymentMethod === 'Card' && (
            <form onSubmit={handleCardPayment}>
              <FormGroup>
                <Label htmlFor="card">Card Number</Label>
                <Input id="card" type="text" placeholder="•••• •••• •••• ••••" />
              </FormGroup>
              <div style={{display: 'flex', gap: '1rem'}}>
                <FormGroup style={{flex: 1}}>
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input id="expiry" type="text" placeholder="MM/YY" />
                </FormGroup>
                <FormGroup style={{flex: 1}}>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" type="text" placeholder="•••" />
                </FormGroup>
              </div>
              <SubmitButton type="submit">Pay ₹{amount}</SubmitButton>
            </form>
          )}

          {paymentMethod === 'UPI' && (
            <form onSubmit={handleUpiPayment}>
              <p>Click the button below to pay with your favorite UPI app.</p>
              <SubmitButton type="submit">Pay ₹{amount} with UPI</SubmitButton>
            </form>
          )}

        </PaymentFormCard>

        <HistoryCard>
          <SectionTitle>Payment History</SectionTitle>
          <HistoryTable>
            <thead>
              <tr>
                <Th>Transaction ID</Th>
                <Th>Date</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <Td>{payment.id}</Td>
                  <Td>{payment.date}</Td>
                  <Td>₹{payment.amount.toFixed(2)}</Td>
                  <Td>{payment.method}</Td>
                  <Td>{payment.status}</Td>
                </tr>
              ))}
            </tbody>
          </HistoryTable>
        </HistoryCard>
      </ContentGrid>
    </PageContainer>
  );
};

export default Payments;