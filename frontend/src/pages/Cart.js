import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateCartItemQuantity, clearCart } from '../features/cart/cartSlice';
import { setAlert } from '../features/alerts/alertSlice';
import Spinner from '../components/layout/Spinner';
import styled from 'styled-components';

const CartContainer = styled.div`
  padding: 2rem 0;
`;

const CartTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: var(--text-color);
`;

const CartContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CartItems = styled.div`
  flex: 1;
  min-width: 0; /* For proper flexbox behavior */
`;

const CartSummary = styled.div`
  flex: 0 0 350px;
  
  @media (max-width: 768px) {
    flex: 1 0 100%;
  }
`;

const SummaryCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
`;

const SummaryTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: ${props => props.total ? '1.2rem' : '1rem'};
  font-weight: ${props => props.total ? '600' : '400'};
  color: ${props => props.total ? 'var(--primary-color)' : 'var(--text-color)'};
  padding-top: ${props => props.total ? '1rem' : '0'};
  border-top: ${props => props.total ? '1px solid var(--border-color)' : 'none'};
`;

const CheckoutButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem;
  font-size: 1.1rem;
  font-weight: 500;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 1.5rem;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ClearCartButton = styled.button`
  background-color: transparent;
  color: var(--light-text);
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  padding: 0;
  text-align: center;
  width: 100%;
  
  &:hover {
    color: var(--error-color);
    text-decoration: underline;
  }
`;

const CartItemCard = styled.div`
  display: flex;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const ItemImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1.5rem;
  
  @media (max-width: 576px) {
    width: 100%;
    height: 150px;
    margin-right: 0;
    margin-bottom: 1rem;
  }
`;

const ItemDetails = styled.div`
  flex: 1;
  min-width: 0; /* For text truncation */
`;

const ItemTitle = styled(Link)`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
  text-decoration: none;
  display: block;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
`;

const ItemAttribute = styled.span`
  display: inline-block;
  background-color: var(--light-bg);
  color: var(--light-text);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const ItemColorDot = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-right: 0.3rem;
`;

const ItemPrice = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-top: auto;
`;

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuantityButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  background-color: white;
  color: var(--text-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 40px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const RemoveButton = styled.button`
  background-color: transparent;
  color: var(--light-text);
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    color: var(--error-color);
    text-decoration: underline;
  }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const EmptyCartTitle = styled.h2`
  color: var(--text-color);
  margin-bottom: 1rem;
`;

const EmptyCartText = styled.p`
  color: var(--light-text);
  margin-bottom: 1.5rem;
`;

const ShopButton = styled(Link)`
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: var(--primary-dark);
  }
`;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, loading } = useSelector(state => state.cart);
  
  const handleQuantityChange = (item, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0 && quantity <= 100) {
      dispatch(updateCartItemQuantity({
        id: item._id, 
        size: item.size, 
        color: item.color, 
        quantity
      }));
    }
  };
  
  const handleRemoveItem = (item) => {
    dispatch(removeFromCart(item));
    dispatch(setAlert({
      msg: 'Item removed from cart',
      type: 'success'
    }));
  };
  
  const handleClearCart = () => {
    dispatch(clearCart());
    dispatch(setAlert({
      msg: 'Cart cleared',
      type: 'success'
    }));
  };
  
  const handleCheckout = () => {
    navigate('/checkout');
  };
  
  // Calculate order summary
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;
  
  if (loading) {
    return <Spinner />;
  }
  
  if (cartItems.length === 0) {
    return (
      <CartContainer>
        <CartTitle>Your Cart</CartTitle>
        <EmptyCart>
          <EmptyCartTitle>Your cart is empty</EmptyCartTitle>
          <EmptyCartText>
            Looks like you haven't added any items to your cart yet.
          </EmptyCartText>
          <ShopButton to="/merchandise">Shop Now</ShopButton>
        </EmptyCart>
      </CartContainer>
    );
  }
  
  return (
    <CartContainer>
      <CartTitle>Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</CartTitle>
      
      <CartContent>
        <CartItems>
          {cartItems.map((item, index) => (
            <CartItemCard key={`${item._id}-${item.size}-${item.color}-${index}`}>
              <ItemImage src={item.imageUrl} alt={item.name} />
              <ItemDetails>
                <ItemTitle to={`/merchandise/${item._id}`}>{item.name}</ItemTitle>
                <ItemMeta>
                  <ItemAttribute>{item.category}</ItemAttribute>
                  {item.size !== 'N/A' && <ItemAttribute>Size: {item.size}</ItemAttribute>}
                  {item.color && (
                    <ItemAttribute>
                      <ItemColorDot color={item.color} />
                      Color
                    </ItemAttribute>
                  )}
                </ItemMeta>
                <ItemPrice>${(item.price * item.quantity).toFixed(2)}</ItemPrice>
                <ItemActions>
                  <QuantityControl>
                    <QuantityButton
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </QuantityButton>
                    <QuantityInput
                      type="number"
                      min="1"
                      max="100"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, e.target.value)}
                    />
                    <QuantityButton
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={item.quantity >= 100}
                    >
                      +
                    </QuantityButton>
                  </QuantityControl>
                  <RemoveButton onClick={() => handleRemoveItem(item)}>
                    Remove
                  </RemoveButton>
                </ItemActions>
              </ItemDetails>
            </CartItemCard>
          ))}
        </CartItems>
        
        <CartSummary>
          <SummaryCard>
            <SummaryTitle>Order Summary</SummaryTitle>
            <SummaryRow>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </SummaryRow>
            <SummaryRow total>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </SummaryRow>
            
            <CheckoutButton onClick={handleCheckout}>
              Proceed to Checkout
            </CheckoutButton>
            <ClearCartButton onClick={handleClearCart}>
              Clear Cart
            </ClearCartButton>
          </SummaryCard>
        </CartSummary>
      </CartContent>
    </CartContainer>
  );
};

export default Cart;