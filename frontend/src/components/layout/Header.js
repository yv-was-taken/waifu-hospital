import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: var(--primary-color);
  padding: 1rem 0;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: white;
  margin-left: 1.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const Button = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-weight: 500;
  cursor: pointer;
  margin-left: 1.5rem;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const CartCount = styled.span`
  background-color: white;
  color: var(--primary-color);
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 50%;
  padding: 0.2rem 0.5rem;
  margin-left: 0.3rem;
`;

const Header = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { cartItems } = useSelector(state => state.cart);

  const handleLogout = () => {
    dispatch(logout());
  };

  const guestLinks = (
    <>
      <NavLink to="/login">Login</NavLink>
      <NavLink to="/register">Register</NavLink>
    </>
  );

  const authLinks = (
    <>
      <NavLink to="/dashboard">Dashboard</NavLink>
      {user && user.isCreator && (
        <NavLink to="/create-character">Create Character</NavLink>
      )}
      <NavLink to="/merchandise">Store</NavLink>
      <NavLink to="/cart">
        Cart
        {cartItems.length > 0 && (
          <CartCount>{cartItems.length}</CartCount>
        )}
      </NavLink>
      <Button onClick={handleLogout}>Logout</Button>
    </>
  );

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">WaifuHospital</Logo>
        <Nav>
          <NavLink to="/">Home</NavLink>
          {isAuthenticated ? authLinks : guestLinks}
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;