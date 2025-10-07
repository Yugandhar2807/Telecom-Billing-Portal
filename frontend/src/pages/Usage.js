import React from 'react';
import styled from 'styled-components';

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
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
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
`;

const HistoryTitle = styled.h3`
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChartRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ChartLabel = styled.div`
  width: 80px;
  font-weight: 500;
  color: #4a5568;
`;

const ChartBar = styled.div`
  flex: 1;
  background: #e2e8f0;
  border-radius: 6px;
  height: 24px;
  overflow: hidden;
`;

const ChartFill = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  color: white;
  font-size: 0.8rem;
`;

// Sample Data
const usageSummary = {
  data: { value: '15.7', unit: 'GB', limit: '30 GB' },
  voice: { value: '345', unit: 'Mins', limit: '1000 Mins' },
  sms: { value: '88', unit: 'SMS', limit: '300 SMS' },
};

const usageHistory = [
  { month: 'March', data: 15.7, dataLimit: 30 },
  { month: 'February', data: 18.2, dataLimit: 30 },
  { month: 'January', data: 12.5, dataLimit: 25 },
];

const Usage = () => {
  return (
    <PageContainer>
      <PageTitle>📊 Usage Tracking</PageTitle>
      <PageSubtitle>
        Monitor your data, voice, and SMS usage in real-time with detailed analytics.
      </PageSubtitle>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Data Usage</StatTitle>
            <StatIcon>📶</StatIcon>
          </StatHeader>
          <StatValue>{usageSummary.data.value} <span style={{fontSize: '1rem'}}>{usageSummary.data.unit}</span></StatValue>
          <p>Limit: {usageSummary.data.limit}</p>
        </StatCard>
        <StatCard>
          <StatHeader>
            <StatTitle>Voice Usage</StatTitle>
            <StatIcon>📞</StatIcon>
          </StatHeader>
          <StatValue>{usageSummary.voice.value} <span style={{fontSize: '1rem'}}>{usageSummary.voice.unit}</span></StatValue>
          <p>Limit: {usageSummary.voice.limit}</p>
        </StatCard>
        <StatCard>
          <StatHeader>
            <StatTitle>SMS Usage</StatTitle>
            <StatIcon>💬</StatIcon>
          </StatHeader>
          <StatValue>{usageSummary.sms.value} <span style={{fontSize: '1rem'}}>{usageSummary.sms.unit}</span></StatValue>
          <p>Limit: {usageSummary.sms.limit}</p>
        </StatCard>
      </StatsGrid>

      <HistorySection>
        <HistoryTitle>Monthly Data Usage History</HistoryTitle>
        <ChartContainer>
          {usageHistory.map(item => (
            <ChartRow key={item.month}>
              <ChartLabel>{item.month}</ChartLabel>
              <ChartBar>
                <ChartFill percentage={(item.data / item.dataLimit) * 100}>
                  {item.data} GB
                </ChartFill>
              </ChartBar>
            </ChartRow>
          ))}
        </ChartContainer>
      </HistorySection>

    </PageContainer>
  );
};

export default Usage;
