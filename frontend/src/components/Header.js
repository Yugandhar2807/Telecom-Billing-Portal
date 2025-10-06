import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%); /* Deeper, richer gradient */
  color: white;
  padding: 1rem 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Stronger, softer shadow */
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.6rem; /* Slightly larger */
  font-weight: bold;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  
  &:hover {
    color: #e2e8f0;
    text-shadow: 0 0 5px rgba(255,255,255,0.5); /* Subtle glow on hover */
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.6rem 1.2rem; /* More padding */
  border-radius: 6px; /* Slightly more rounded */
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2); /* More visible hover */
    transform: translateY(-2px); /* More pronounced lift */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); /* Add shadow on hover */
  }
  
  &.active {
    background-color: rgba(255, 255, 255, 0.3); /* More distinct active state */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const UserName = styled.span`
  font-weight: 500;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const LogoutButton = styled.button`
  background: rgba(220, 38, 38, 0.9); /* Slightly less transparent */
  color: white;
  border: none;
  padding: 0.6rem 1.2rem; /* More padding */
  border-radius: 6px; /* Slightly more rounded */
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(220, 38, 38, 1); /* Solid on hover */
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); /* Add shadow on hover */
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%); /* Match header gradient */
  flex-direction: column;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &.open {
    display: flex;
  }
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
  }
`;

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">
          📱 TelecomBill Portal
        </Logo>
        
        {isAuthenticated ? (
          <>
            <NavLinks>
              <NavLink 
                to="/" 
                className={isActiveRoute('/') ? 'active' : ''}
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/bills" 
                className={isActiveRoute('/bills') ? 'active' : ''}
              >
                Bills
              </NavLink>
              <NavLink 
                to="/usage" 
                className={isActiveRoute('/usage') ? 'active' : ''}
              >
                Usage
              </NavLink>
              <NavLink 
                to="/payments" 
                className={isActiveRoute('/payments') ? 'active' : ''}
              >
                Payments
              </NavLink>
              <NavLink 
                to="/profile" 
                className={isActiveRoute('/profile') ? 'active' : ''}
              >
                Profile
              </NavLink>
            </NavLinks>
            
            <UserInfo>
              <UserName>
                Hello, {user?.first_name || 'User'}!
              </UserName>
              <LogoutButton onClick={handleLogout}>
                Logout
              </LogoutButton>
            </UserInfo>
            
            <MobileMenuButton onClick={toggleMobileMenu}>
              ☰
            </MobileMenuButton>
          </>
        ) : (
          <NavLinks>
            <NavLink 
              to="/login" 
              className={isActiveRoute('/login') ? 'active' : ''}
            >
              Login
            </NavLink>
            <NavLink 
              to="/register" 
              className={isActiveRoute('/register') ? 'active' : ''}
            >
              Register
            </NavLink>
          </NavLinks>
        )}
      </Nav>
      
      {isAuthenticated && (
        <MobileMenu isOpen={mobileMenuOpen}>
          <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/bills" onClick={() => setMobileMenuOpen(false)}>
            Bills
          </NavLink>
          <NavLink to="/usage" onClick={() => setMobileMenuOpen(false)}>
            Usage
          </NavLink>
          <NavLink to="/payments" onClick={() => setMobileMenuOpen(false)}>
            Payments
          </NavLink>
          <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)}>
            Profile
          </NavLink>
          <UserInfo style={{ marginTop: '1rem', justifyContent: 'center' }}>
            <span>Hello, {user?.first_name || 'User'}!</span>
            <LogoutButton onClick={handleLogout}>
              Logout
            </LogoutButton>
          </UserInfo>
        </MobileMenu>
      )}
    </HeaderContainer>
  );
};

export default Header;
