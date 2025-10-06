import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: #2d3748;
  color: white;
  padding: 2rem 0 1rem;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const FooterLink = styled.a`
  color: #e2e8f0;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  
  &:hover {
    color: white;
  }
`;

const Copyright = styled.p`
  font-size: 0.9rem;
  color: #a0aec0;
  margin: 1rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid #4a5568;
`;

const CompanyInfo = styled.p`
  font-size: 0.8rem;
  color: #cbd5e0;
  margin: 0.5rem 0 0;
  font-style: italic;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <FooterLinks>
          <FooterLink href="#privacy">Privacy Policy</FooterLink>
          <FooterLink href="#terms">Terms of Service</FooterLink>
          <FooterLink href="#support">Support</FooterLink>
          <FooterLink href="#about">About Us</FooterLink>
          <FooterLink href="#contact">Contact</FooterLink>
        </FooterLinks>
        
        <Copyright>
          &copy; {currentYear} TelecomBill Portal. All rights reserved.
        </Copyright>
        
        <CompanyInfo>
          Transparent billing for better customer experience
        </CompanyInfo>
      </FooterContent>
    </FooterContainer>
  );
};

export default Footer;
