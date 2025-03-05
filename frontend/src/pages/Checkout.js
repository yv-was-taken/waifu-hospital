import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "../features/cart/cartSlice";
import { setAlert } from "../features/alerts/alertSlice";
import styled from "styled-components";

const CheckoutContainer = styled.div`
  padding: 2rem 0;
`;

const CheckoutHeader = styled.div`
  margin-bottom: 2rem;
`;

const CheckoutTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-color);
`;

const CheckoutDescription = styled.p`
  color: var(--light-text);
  font-size: 1.1rem;
  max-width: 800px;
`;

const CheckoutContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CheckoutForm = styled.form`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0;
  }
`;

const FormGroup = styled.div`
  flex: ${(props) => props.flex || 1};
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const FormRadioGroup = styled.div`
  margin-top: 0.5rem;
`;

const FormRadioOption = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
`;

const RadioInput = styled.input`
  margin-right: 0.8rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  font-weight: normal;
`;

const PaymentIcon = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 1.2rem;
`;

const OrderSummary = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  align-self: flex-start;
  position: sticky;
  top: 2rem;
`;

const SummaryTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
`;

const ItemList = styled.div`
  margin-bottom: 1.5rem;
`;

const Item = styled.div`
  display: flex;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
`;

const ItemImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemTitle = styled.p`
  font-weight: 500;
  margin: 0 0 0.3rem 0;
  color: var(--text-color);
`;

const ItemMeta = styled.p`
  margin: 0 0 0.3rem 0;
  font-size: 0.9rem;
  color: var(--light-text);
`;

const ItemPrice = styled.p`
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
  text-align: right;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: ${(props) => (props.total ? "1.2rem" : "1rem")};
  font-weight: ${(props) => (props.total ? "600" : "400")};
  padding-top: ${(props) => (props.total ? "1rem" : "0")};
  border-top: ${(props) =>
    props.total ? "1px solid var(--border-color)" : "none"};
`;

const PlaceOrderButton = styled.button`
  width: 100%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 500;
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

const Checkbox = styled.input`
  margin-right: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    paymentMethod: "credit",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    sameAsShipping: false,
  });

  const [billingData, setBillingData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
      dispatch(
        setAlert({
          msg: "Your cart is empty",
          type: "info",
        }),
      );
    }
  }, [cartItems, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSameAsShipping = (e) => {
    const { checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      sameAsShipping: checked,
    }));

    if (checked) {
      setBillingData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
      });
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax rate
  };

  const calculateShipping = () => {
    // Simple shipping calculation
    const subtotal = calculateSubtotal();
    if (subtotal > 100) return 0; // Free shipping over $100
    return 5.99;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Here you would typically integrate with a payment processor
    // and send order details to your backend

    // For demo purposes, we'll just simulate a successful order

    // Simulate API call delay
    setTimeout(() => {
      // Clear the cart
      dispatch(clearCart());

      // Show success message
      dispatch(
        setAlert({
          msg: "Order placed successfully!",
          type: "success",
        }),
      );

      // Redirect to a thank you page (or back to dashboard)
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <CheckoutContainer>
      <CheckoutHeader>
        <CheckoutTitle>Checkout</CheckoutTitle>
        <CheckoutDescription>
          Complete your purchase by providing your shipping, billing, and
          payment details below.
        </CheckoutDescription>
      </CheckoutHeader>

      <CheckoutContent>
        <CheckoutForm onSubmit={handleSubmit}>
          <FormSection>
            <FormTitle>Shipping Information</FormTitle>
            <FormRow>
              <FormGroup>
                <FormLabel htmlFor="firstName">First Name</FormLabel>
                <FormInput
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel htmlFor="lastName">Last Name</FormLabel>
                <FormInput
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <FormInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="address">Street Address</FormLabel>
              <FormInput
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <FormLabel htmlFor="city">City</FormLabel>
                <FormInput
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel htmlFor="state">State/Province</FormLabel>
                <FormInput
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <FormLabel htmlFor="zip">ZIP/Postal Code</FormLabel>
                <FormInput
                  type="text"
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <FormLabel htmlFor="country">Country</FormLabel>
              <FormSelect
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="JP">Japan</option>
              </FormSelect>
            </FormGroup>
          </FormSection>

          <FormSection>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <FormTitle>Billing Information</FormTitle>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  id="sameAsShipping"
                  name="sameAsShipping"
                  checked={formData.sameAsShipping}
                  onChange={handleSameAsShipping}
                />
                Same as shipping
              </CheckboxLabel>
            </div>

            {!formData.sameAsShipping ? (
              <>
                <FormRow>
                  <FormGroup>
                    <FormLabel htmlFor="billingFirstName">First Name</FormLabel>
                    <FormInput
                      type="text"
                      id="billingFirstName"
                      name="firstName"
                      value={billingData.firstName}
                      onChange={handleBillingChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="billingLastName">Last Name</FormLabel>
                    <FormInput
                      type="text"
                      id="billingLastName"
                      name="lastName"
                      value={billingData.lastName}
                      onChange={handleBillingChange}
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <FormLabel htmlFor="billingAddress">Street Address</FormLabel>
                  <FormInput
                    type="text"
                    id="billingAddress"
                    name="address"
                    value={billingData.address}
                    onChange={handleBillingChange}
                    required
                  />
                </FormGroup>

                <FormRow>
                  <FormGroup>
                    <FormLabel htmlFor="billingCity">City</FormLabel>
                    <FormInput
                      type="text"
                      id="billingCity"
                      name="city"
                      value={billingData.city}
                      onChange={handleBillingChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="billingState">State/Province</FormLabel>
                    <FormInput
                      type="text"
                      id="billingState"
                      name="state"
                      value={billingData.state}
                      onChange={handleBillingChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="billingZip">ZIP/Postal Code</FormLabel>
                    <FormInput
                      type="text"
                      id="billingZip"
                      name="zip"
                      value={billingData.zip}
                      onChange={handleBillingChange}
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <FormLabel htmlFor="billingCountry">Country</FormLabel>
                  <FormSelect
                    id="billingCountry"
                    name="country"
                    value={billingData.country}
                    onChange={handleBillingChange}
                    required
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                  </FormSelect>
                </FormGroup>
              </>
            ) : null}
          </FormSection>

          <FormSection>
            <FormTitle>Payment Method</FormTitle>
            <FormGroup>
              <FormLabel>Select Payment Method</FormLabel>
              <FormRadioGroup>
                <FormRadioOption>
                  <RadioInput
                    type="radio"
                    id="creditCard"
                    name="paymentMethod"
                    value="credit"
                    checked={formData.paymentMethod === "credit"}
                    onChange={handleChange}
                  />
                  <RadioLabel htmlFor="creditCard">
                    Credit Card
                    <PaymentIcon>💳</PaymentIcon>
                  </RadioLabel>
                </FormRadioOption>
                <FormRadioOption>
                  <RadioInput
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === "paypal"}
                    onChange={handleChange}
                  />
                  <RadioLabel htmlFor="paypal">
                    PayPal
                    <PaymentIcon>🅿️</PaymentIcon>
                  </RadioLabel>
                </FormRadioOption>
                <FormRadioOption>
                  <RadioInput
                    type="radio"
                    id="crypto"
                    name="paymentMethod"
                    value="crypto"
                    checked={formData.paymentMethod === "crypto"}
                    onChange={handleChange}
                  />
                  <RadioLabel htmlFor="crypto">
                    Cryptocurrency
                    <PaymentIcon>🪙</PaymentIcon>
                  </RadioLabel>
                </FormRadioOption>
              </FormRadioGroup>
            </FormGroup>

            {formData.paymentMethod === "credit" && (
              <>
                <FormGroup>
                  <FormLabel htmlFor="cardName">Name on Card</FormLabel>
                  <FormInput
                    type="text"
                    id="cardName"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="cardNumber">Card Number</FormLabel>
                  <FormInput
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="XXXX XXXX XXXX XXXX"
                    required
                  />
                </FormGroup>

                <FormRow>
                  <FormGroup>
                    <FormLabel htmlFor="cardExpiry">Expiration Date</FormLabel>
                    <FormInput
                      type="text"
                      id="cardExpiry"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel htmlFor="cardCvv">CVV</FormLabel>
                    <FormInput
                      type="text"
                      id="cardCvv"
                      name="cardCvv"
                      value={formData.cardCvv}
                      onChange={handleChange}
                      placeholder="XXX"
                      required
                    />
                  </FormGroup>
                </FormRow>
              </>
            )}

            {formData.paymentMethod === "paypal" && (
              <p style={{ marginTop: "1rem", color: "var(--light-text)" }}>
                You will be redirected to PayPal to complete your payment after
                reviewing your order.
              </p>
            )}

            {formData.paymentMethod === "crypto" && (
              <p style={{ marginTop: "1rem", color: "var(--light-text)" }}>
                You will be provided with crypto payment details after reviewing
                your order.
              </p>
            )}
          </FormSection>

          <PlaceOrderButton type="submit">Place Order</PlaceOrderButton>
        </CheckoutForm>

        <OrderSummary>
          <SummaryTitle>Order Summary</SummaryTitle>

          <ItemList>
            {cartItems.map((item) => (
              <Item key={`${item._id}-${item.size}-${item.color}`}>
                <ItemImage src={item.imageUrl} alt={item.name} />
                <ItemInfo>
                  <ItemTitle>{item.name}</ItemTitle>
                  <ItemMeta>Quantity: {item.quantity}</ItemMeta>
                  {item.size && item.size !== "N/A" && (
                    <ItemMeta>Size: {item.size}</ItemMeta>
                  )}
                  {item.color && <ItemMeta>Color: {item.color}</ItemMeta>}
                </ItemInfo>
                <ItemPrice>
                  ${(item.price * item.quantity).toFixed(2)}
                </ItemPrice>
              </Item>
            ))}
          </ItemList>

          <SummaryRow>
            <span>Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </SummaryRow>
          <SummaryRow>
            <span>Tax (8%):</span>
            <span>${calculateTax().toFixed(2)}</span>
          </SummaryRow>
          <SummaryRow>
            <span>Shipping:</span>
            <span>
              {calculateShipping() === 0
                ? "Free"
                : `$${calculateShipping().toFixed(2)}`}
            </span>
          </SummaryRow>
          <SummaryRow total>
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </SummaryRow>
        </OrderSummary>
      </CheckoutContent>
    </CheckoutContainer>
  );
};

export default Checkout;
