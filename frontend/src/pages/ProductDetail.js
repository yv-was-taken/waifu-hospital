import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMerchandiseById } from "../features/merchandise/merchandiseSlice";
import { addToCart } from "../features/cart/cartSlice";
import { setAlert } from "../features/alerts/alertSlice";
import Spinner from "../components/layout/Spinner";
import styled from "styled-components";

const ProductContainer = styled.div`
  padding: 2rem 0;
`;

const BreadcrumbNav = styled.div`
  margin-bottom: 2rem;
  color: var(--light-text);
  font-size: 0.9rem;
`;

const BreadcrumbLink = styled(Link)`
  color: var(--light-text);
  text-decoration: none;

  &:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }
`;

const ProductContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ProductImageContainer = styled.div`
  flex: 0 0 45%;

  @media (max-width: 768px) {
    flex: 1 0 100%;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const ProductDetails = styled.div`
  flex: 1;
`;

const ProductTitle = styled.h1`
  font-size: 2.2rem;
  margin: 0 0 1rem 0;
  color: var(--text-color);
`;

const ProductPrice = styled.p`
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1.5rem 0;
`;

const ProductDescription = styled.p`
  margin-bottom: 2rem;
  line-height: 1.6;
  color: var(--text-color);
`;

const ProductMeta = styled.div`
  margin-bottom: 2rem;
`;

const MetaItem = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const MetaLabel = styled.span`
  font-weight: 500;
  width: 120px;
  color: var(--light-text);
`;

const MetaValue = styled.span`
  color: var(--text-color);
`;

const CategoryBadge = styled.span`
  display: inline-block;
  background-color: var(--light-bg);
  color: var(--light-text);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const CharacterBadge = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-color);
`;

const CharacterImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 0.5rem;
`;

const CreatorBadge = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-color);
`;

const CreatorImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 0.5rem;
`;

const ProductOptions = styled.div`
  margin-bottom: 2rem;
`;

const OptionGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const OptionLabel = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const SizeOptions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SizeButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid
    ${(props) =>
      props.selected ? "var(--primary-color)" : "var(--border-color)"};
  background-color: ${(props) =>
    props.selected ? "var(--primary-color)" : "white"};
  color: ${(props) => (props.selected ? "white" : "var(--text-color)")};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ColorOptions = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const ColorButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid
    ${(props) => (props.selected ? "var(--primary-color)" : "transparent")};
  background-color: ${(props) => props.color};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
  }

  &:before {
    content: "";
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    border: 2px solid var(--primary-color);
    opacity: ${(props) => (props.selected ? 1 : 0)};
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  background-color: white;
  color: var(--text-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
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
  width: 50px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: center;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const AddToCartButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 2rem;

  &:hover {
    background-color: var(--primary-dark);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const StockStatus = styled.div`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background-color: ${(props) => (props.inStock ? "#e3fcef" : "#ffecec")};
  color: ${(props) =>
    props.inStock ? "var(--success-color)" : "var(--error-color)"};
  border-radius: 4px;
  font-size: 0.9rem;
  margin-left: 1rem;
`;

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { product, loading } = useSelector((state) => state.merchandise);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(getMerchandiseById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (product) {
      // Set default selections if available
      if (product.availableSizes && product.availableSizes.length > 0) {
        setSelectedSize(product.availableSizes[0]);
      }

      if (product.availableColors && product.availableColors.length > 0) {
        setSelectedColor(product.availableColors[0]);
      }
    }
  }, [product]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= (product?.stock || 1)) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    if (quantity < (product?.stock || 1)) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      dispatch(
        setAlert({
          msg: "Please log in to add items to your cart",
          type: "info",
        }),
      );
      navigate("/login");
      return;
    }

    const cartItem = {
      _id: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      category: product.category,
      size: selectedSize || "N/A",
      color: selectedColor || "",
      quantity,
      merchandiseId: product._id,
    };

    dispatch(addToCart(cartItem));

    dispatch(
      setAlert({
        msg: "Item added to cart",
        type: "success",
      }),
    );
  };

  if (loading) {
    return <Spinner />;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  const inStock = product.stock > 0;

  return (
    <ProductContainer>
      <BreadcrumbNav>
        <BreadcrumbLink to="/">Home</BreadcrumbLink> /{" "}
        <BreadcrumbLink to="/merchandise">Merchandise</BreadcrumbLink> /{" "}
        {product.name}
      </BreadcrumbNav>

      <ProductContent>
        <ProductImageContainer>
          <ProductImage src={product.imageUrl} alt={product.name} />
        </ProductImageContainer>

        <ProductDetails>
          <ProductTitle>{product.name}</ProductTitle>
          <ProductPrice>${product.price.toFixed(2)}</ProductPrice>
          <ProductDescription>{product.description}</ProductDescription>

          <ProductMeta>
            <MetaItem>
              <MetaLabel>Category:</MetaLabel>
              <CategoryBadge>{product.category}</CategoryBadge>
            </MetaItem>

            {product.character && (
              <MetaItem>
                <MetaLabel>Character:</MetaLabel>
                <CharacterBadge to={`/characters/${product.character._id}`}>
                  <CharacterImage
                    src={product.character.imageUrl}
                    alt={product.character.name}
                  />
                  {product.character.name}
                </CharacterBadge>
              </MetaItem>
            )}

            {product.creator && (
              <MetaItem>
                <MetaLabel>Creator:</MetaLabel>
                <CreatorBadge to={`/users/${product.creator._id}`}>
                  {product.creator.profilePicture && (
                    <CreatorImage
                      src={product.creator.profilePicture}
                      alt={product.creator.username}
                    />
                  )}
                  {product.creator.username}
                </CreatorBadge>
              </MetaItem>
            )}

            <MetaItem>
              <MetaLabel>Availability:</MetaLabel>
              {inStock ? (
                <StockStatus inStock={true}>
                  In Stock ({product.stock} available)
                </StockStatus>
              ) : (
                <StockStatus inStock={false}>Out of Stock</StockStatus>
              )}
            </MetaItem>
          </ProductMeta>

          <ProductOptions>
            {product.availableSizes &&
              product.availableSizes.length > 0 &&
              product.availableSizes[0] !== "N/A" && (
                <OptionGroup>
                  <OptionLabel>Size:</OptionLabel>
                  <SizeOptions>
                    {product.availableSizes.map((size) => (
                      <SizeButton
                        key={size}
                        selected={selectedSize === size}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </SizeButton>
                    ))}
                  </SizeOptions>
                </OptionGroup>
              )}

            {product.availableColors && product.availableColors.length > 0 && (
              <OptionGroup>
                <OptionLabel>Color:</OptionLabel>
                <ColorOptions>
                  {product.availableColors.map((color) => (
                    <ColorButton
                      key={color}
                      color={color}
                      selected={selectedColor === color}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </ColorOptions>
              </OptionGroup>
            )}

            <OptionGroup>
              <OptionLabel>Quantity:</OptionLabel>
              <QuantityControl>
                <QuantityButton
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </QuantityButton>
                <QuantityInput
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                />
                <QuantityButton
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock}
                >
                  +
                </QuantityButton>
              </QuantityControl>
            </OptionGroup>
          </ProductOptions>

          <AddToCartButton onClick={handleAddToCart} disabled={!inStock}>
            {inStock ? "Add to Cart" : "Out of Stock"}
          </AddToCartButton>
        </ProductDetails>
      </ProductContent>
    </ProductContainer>
  );
};

export default ProductDetail;
