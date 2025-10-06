import React, { useState } from 'react';
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

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const ProfileCard = styled.div`
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

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 0; /* More padding */
  border-bottom: 1px solid #f7fafc; /* Lighter separator */

  &:last-of-type {
    border-bottom: none; /* No border on last item */
  }
`;

const InfoLabel = styled.span`
  color: #718096;
  font-weight: 500;
  font-size: 0.95rem;
`;

const InfoValue = styled.span`
  color: #2d3748;
  font-weight: 500;
  font-size: 0.95rem;
`;

const InfoInput = styled.input`
  color: #2d3748;
  font-weight: 500;
  border: 2px solid #cbd5e0; /* Softer border */
  border-radius: 10px; /* More rounded */
  padding: 0.4rem 0.7rem; /* More padding */
  font-size: 0.95rem;
  width: 60%;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2); /* Stronger glow */
  }
`;

const ButtonContainer = styled.div`
  margin-top: 2rem; /* More space */
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%); /* New gradient */
  color: white;
  border: none;
  padding: 0.95rem 1.8rem; /* More padding */
  border-radius: 10px; /* More rounded */
  cursor: pointer;
  font-weight: 700; /* Bolder */
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px); /* More pronounced lift */
    box-shadow: 0 8px 20px rgba(76, 81, 191, 0.4); /* Stronger shadow */
  }
`;

const SaveButton = styled(ActionButton)`
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); /* Green gradient */
  &:hover {
    background: linear-gradient(135deg, #2f855a 0%, #276749 100%);
    box-shadow: 0 8px 20px rgba(56, 161, 105, 0.4);
  }
`;

const CancelButton = styled(ActionButton)`
  background: linear-gradient(135deg, #a0aec0 0%, #718096 100%); /* Gray gradient */
  &:hover {
    background: linear-gradient(135deg, #718096 0%, #5f6773 100%);
    box-shadow: 0 8px 20px rgba(160, 174, 192, 0.4);
  }
`;

const PlanSelection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PlanOption = styled.label`
  display: flex;
  align-items: center;
  padding: 1rem; /* More padding */
  border: 2px solid #e2e8f0;
  border-radius: 12px; /* More rounded */
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f7fafc; /* Light background */

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 10px rgba(102, 126, 234, 0.1); /* Subtle shadow on hover */
  }

  &.selected {
    border-color: #4c51bf; /* Match new primary color */
    box-shadow: 0 0 0 4px rgba(76, 81, 191, 0.2); /* Stronger glow */
    background: #ebf4ff; /* Lighter background for selected */
  }
`;

const PlanDetails = styled.div`
  margin-left: 1rem;
`;

const PlanName = styled.div`
  font-weight: bold;
  color: #2d3748;
  font-size: 1.05rem;
`;

const PlanPrice = styled.div`
  font-size: 0.9rem;
  color: #718096;
`;

// Sample Data
const initialProfile = {
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '9876543210',
  customerId: 'TB123456001',
  address: '123 Demo Street, Mumbai, Maharashtra, 400001',
  memberSince: 'Jan 1, 2023'
};

const initialPlan = {
  id: 3,
  planName: 'Premium Plan',
  monthlyCost: '₹699.00',
  data: '5 GB / month',
  calls: 'Unlimited',
  sms: 'Unlimited',
  renewalDate: 'Apr 1, 2024'
};

const availablePlans = [
  {
    id: 1,
    planName: 'Basic Plan',
    monthlyCost: '₹199.00',
    data: '1 GB / month',
    calls: '100 Mins',
    sms: '100 SMS'
  },
  {
    id: 2,
    planName: 'Standard Plan',
    monthlyCost: '₹399.00',
    data: '2 GB / month',
    calls: '200 Mins',
    sms: '200 SMS'
  },
  {
    id: 3,
    planName: 'Premium Plan',
    monthlyCost: '₹699.00',
    data: '5 GB / month',
    calls: 'Unlimited',
    sms: 'Unlimited'
  }
];

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(initialProfile);
  const [tempProfileData, setTempProfileData] = useState(initialProfile);

  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(initialPlan);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  const handleEdit = () => {
    setTempProfileData(profileData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfileData(tempProfileData);
    setIsEditing(false);
    alert('Profile saved! (This is a demo)');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanChangeClick = () => {
    setSelectedPlan(currentPlan);
    setIsChangingPlan(true);
  };

  const handleConfirmPlanChange = () => {
    setCurrentPlan(selectedPlan);
    setIsChangingPlan(false);
    alert(`Plan changed to ${selectedPlan.planName}! (This is a demo)`);
  };

  return (
    <PageContainer>
      <PageTitle>👤 My Profile</PageTitle>
      <PageSubtitle>
        Manage your account settings, personal information, and preferences.
      </PageSubtitle>

      <ProfileGrid>
        <ProfileCard>
          <SectionTitle>Personal Information</SectionTitle>
          <InfoRow>
            <InfoLabel>Name</InfoLabel>
            {isEditing ? <InfoInput name="name" value={tempProfileData.name} onChange={handleChange} /> : <InfoValue>{profileData.name}</InfoValue>}
          </InfoRow>
          <InfoRow>
            <InfoLabel>Email</InfoLabel>
            {isEditing ? <InfoInput name="email" type="email" value={tempProfileData.email} onChange={handleChange} /> : <InfoValue>{profileData.email}</InfoValue>}
          </InfoRow>
          <InfoRow>
            <InfoLabel>Phone</InfoLabel>
            {isEditing ? <InfoInput name="phone" value={tempProfileData.phone} onChange={handleChange} /> : <InfoValue>{profileData.phone}</InfoValue>}
          </InfoRow>
          <InfoRow>
            <InfoLabel>Address</InfoLabel>
            {isEditing ? <InfoInput name="address" value={tempProfileData.address} onChange={handleChange} /> : <InfoValue>{profileData.address}</InfoValue>}
          </InfoRow>
          <InfoRow>
            <InfoLabel>Customer ID</InfoLabel>
            <InfoValue>{profileData.customerId}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Member Since</InfoLabel>
            <InfoValue>{profileData.memberSince}</InfoValue>
          </InfoRow>
          <ButtonContainer>
            {isEditing ? (
              <>
                <SaveButton onClick={handleSave}>Save</SaveButton>
                <CancelButton onClick={handleCancel}>Cancel</CancelButton>
              </>
            ) : (
              <ActionButton onClick={handleEdit}>Edit Profile</ActionButton>
            )}
          </ButtonContainer>
        </ProfileCard>

        <ProfileCard>
          <SectionTitle>Current Plan</SectionTitle>
          {isChangingPlan ? (
            <PlanSelection>
              {availablePlans.map(plan => (
                <PlanOption key={plan.id} className={selectedPlan.id === plan.id ? 'selected' : ''}>
                  <input 
                    type="radio" 
                    name="plan" 
                    checked={selectedPlan.id === plan.id} 
                    onChange={() => setSelectedPlan(plan)} 
                  />
                  <PlanDetails>
                    <PlanName>{plan.planName}</PlanName>
                    <PlanPrice>{plan.monthlyCost} - {plan.data}</PlanPrice>
                  </PlanDetails>
                </PlanOption>
              ))}
              <ButtonContainer>
                <SaveButton onClick={handleConfirmPlanChange}>Confirm Change</SaveButton>
                <CancelButton onClick={() => setIsChangingPlan(false)}>Cancel</CancelButton>
              </ButtonContainer>
            </PlanSelection>
          ) : (
            <>
              <InfoRow>
                <InfoLabel>Plan Name</InfoLabel>
                <InfoValue>{currentPlan.planName}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Monthly Cost</InfoLabel>
                <InfoValue>{currentPlan.monthlyCost}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Data Allowance</InfoLabel>
                <InfoValue>{currentPlan.data}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Calls</InfoLabel>
                <InfoValue>{currentPlan.calls}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>SMS</InfoLabel>
                <InfoValue>{currentPlan.sms}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Next Renewal</InfoLabel>
                <InfoValue>{currentPlan.renewalDate}</InfoValue>
              </InfoRow>
              <ButtonContainer>
                <ActionButton onClick={handlePlanChangeClick}>Change Plan</ActionButton>
              </ButtonContainer>
            </>
          )}
        </ProfileCard>
      </ProfileGrid>
    </PageContainer>
  );
};

export default Profile;