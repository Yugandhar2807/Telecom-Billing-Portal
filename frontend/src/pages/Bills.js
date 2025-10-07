import React from 'react';
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

const BillsTable = styled.table`
  width: 100%;
  background: white;
  border-radius: 16px; /* More rounded */
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15); /* Stronger, softer shadow */
  border-collapse: separate; /* Use separate for border-spacing */
  border-spacing: 0 0.5rem; /* Add vertical spacing between rows */
  overflow: hidden;
`;

const Th = styled.th`
  background-color: #edf2f7; /* Lighter header background */
  padding: 0.9rem 1.5rem; /* More padding */
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
  padding: 1rem 1.5rem; /* More padding */
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

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem; /* More padding */
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.85rem; /* Slightly larger */
  color: ${props => props.status === 'Paid' ? '#2f855a' : '#c53030'};
  background-color: ${props => props.status === 'Paid' ? '#c6f6d5' : '#fed7d7'};
`;

const DownloadButton = styled.button`
  background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%); /* New gradient */
  color: white;
  border: none;
  padding: 0.6rem 1.2rem; /* More padding */
  border-radius: 8px; /* More rounded */
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px); /* More pronounced lift */
    box-shadow: 0 8px 20px rgba(76, 81, 191, 0.4); /* Stronger shadow */
  }
`;

const Bills = () => {
  const { bills } = useAuth();

  const handleDownload = (bill) => {
    // Create file content
    const fileContent = `
      Telecom Billing Portal - Invoice
      --------------------------------
      Invoice #: ${bill.invoiceNumber}
      Status: ${bill.status}
      Amount: ₹${bill.amount.toFixed(2)}
      Due Date: ${bill.dueDate}
      Billing Period: ${bill.billingPeriod}
      
      Charges:
      - Premium Plan: ₹${bill.amount.toFixed(2)}

      Thank you for your payment.
    `;

    // Create a blob from the content
    const blob = new Blob([fileContent], { type: 'text/plain' });

    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${bill.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer>
      <PageTitle>📋 Bills & Invoices</PageTitle>
      <PageSubtitle>
        Here is your billing history. You can view and download your past invoices.
      </PageSubtitle>

      <BillsTable>
        <thead>
          <tr>
            <Th>Invoice #</Th>
            <Th>Billing Period</Th>
            <Th>Due Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {bills.map(bill => (
            <tr key={bill.id}>
              <Td>{bill.invoiceNumber}</Td>
              <Td>{bill.billingPeriod}</Td>
              <Td>{bill.dueDate}</Td>
              <Td>₹{bill.amount.toFixed(2)}</Td>
              <Td>
                <StatusBadge status={bill.status}>{bill.status}</StatusBadge>
              </Td>
              <Td>
                <DownloadButton onClick={() => handleDownload(bill)}>
                  Download
                </DownloadButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </BillsTable>
    </PageContainer>
  );
};

export default Bills;