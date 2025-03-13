import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createMerchandise } from "../features/merchandise/merchandiseSlice";
import { getCharacterById } from "../features/characters/characterSlice";
import Spinner from "../components/layout/Spinner";
import styled from "styled-components";

// Import product IDs from constants
const PRODUCT_IDS = {
  // Black t-shirts
  "Gildan Unisex Softstyle T-Shirt (Black / 3XL)": 629,
  "Gildan Unisex Softstyle T-Shirt (Black / 2XL)": 598,
  "Gildan Unisex Softstyle T-Shirt (Black / XL)": 567,
  "Gildan Unisex Softstyle T-Shirt (Black / L)": 536,
  "Gildan Unisex Softstyle T-Shirt (Black / M)": 505,
  "Gildan Unisex Softstyle T-Shirt (Black / S)": 474,
  // White t-shirts
  "Gildan Unisex Softstyle T-Shirt (White / 3XL)": 628,
  "Gildan Unisex Softstyle T-Shirt (White / 2XL)": 597,
  "Gildan Unisex Softstyle T-Shirt (White / XL)": 566,
  "Gildan Unisex Softstyle T-Shirt (White / L)": 535,
  "Gildan Unisex Softstyle T-Shirt (White / M)": 504,
  "Gildan Unisex Softstyle T-Shirt (White / S)": 473,
  // Black hoodies
  "Gildan Unisex Hooded Sweatshirt (Black / 3XL)": 5535,
  "Gildan Unisex Hooded Sweatshirt (Black / 2XL)": 5534,
  "Gildan Unisex Hooded Sweatshirt (Black / XL)": 5533,
  "Gildan Unisex Hooded Sweatshirt (Black / L)": 5532,
  "Gildan Unisex Hooded Sweatshirt (Black / M)": 5531,
  "Gildan Unisex Hooded Sweatshirt (Black / S)": 5530,
  // White hoodies
  "Gildan Unisex Hooded Sweatshirt (White / 3XL)": 5527,
  "Gildan Unisex Hooded Sweatshirt (White / 2XL)": 5526,
  "Gildan Unisex Hooded Sweatshirt (White / L)": 5524,
  "Gildan Unisex Hooded Sweatshirt (White / M)": 5523,
  "Gildan Unisex Hooded Sweatshirt (White / S)": 5522,
  // Hats
  "Otto Cap Foam Trucker Hat (White / One size)": 15905,
  "Otto Cap Foam Trucker Hat (Black/White/Black / One size)": 15908,
  // Coffee mugs
  "Black Glossy Mug (11 oz)": 9323,
  "White Glossy Mug 11 oz": 1320,
  // Mouse pads
  "Gaming Mouse Pad (White / 18″×16″)": 14943,
  "Gaming Mouse Pad (White / 36″×18″)": 14942,
  // Stickers
  "Kiss Cut Vinyl Stickers (3″×3″in)": 10163,
  "Kiss Cut Vinyl Stickers (4″×4″in)": 10164,
  "Kiss Cut Vinyl Stickers (5.5″×5.5″in)": 10165,
  "Kiss Cut Vinyl Stickers (White / 15″×3.75″)": 16362,
  "Kiss-Cut Holographic Stickers (3″×3″in)": 16705,
  "Kiss-Cut Holographic Stickers (4″×4″in)": 16706,
  "Kiss-Cut Holographic Stickers (5.5″×5.5″in)": 16707,
};

// Product retail prices
const PRODUCT_ID_RETAIL_PRICES = {
  // t-shirts
  629: "39.99",
  598: "39.99",
  567: "39.99",
  536: "39.99",
  505: "39.99",
  474: "39.99",
  628: "39.99",
  597: "39.99",
  566: "39.99",
  535: "39.99",
  504: "39.99",
  473: "39.99",
  // hoodies
  5535: "69.99",
  5534: "69.99",
  5533: "69.99",
  5532: "69.99",
  5531: "69.99",
  5530: "69.99",
  5527: "69.99",
  5526: "69.99",
  5524: "69.99",
  5523: "69.99",
  5522: "69.99",
  // hats
  15905: "29.99",
  15908: "29.99",
  // mugs
  9323: "19.99",
  1320: "19.99",
  // mouse pad
  14943: "19.99",
  14942: "29.99",
  // vinyl stickers
  10163: "0.99",
  10164: "1.49",
  10165: "1.99",
  16362: "4.99",
  // holographic stickers
  16705: "1.99",
  16706: "2.49",
  16707: "4.99",
};

// Group products by category
const PRODUCT_CATEGORIES = {
  "t-shirt": [
    "Gildan Unisex Softstyle T-Shirt (Black / S)",
    "Gildan Unisex Softstyle T-Shirt (Black / M)",
    "Gildan Unisex Softstyle T-Shirt (Black / L)",
    "Gildan Unisex Softstyle T-Shirt (Black / XL)",
    "Gildan Unisex Softstyle T-Shirt (Black / 2XL)",
    "Gildan Unisex Softstyle T-Shirt (Black / 3XL)",
    "Gildan Unisex Softstyle T-Shirt (White / S)",
    "Gildan Unisex Softstyle T-Shirt (White / M)",
    "Gildan Unisex Softstyle T-Shirt (White / L)",
    "Gildan Unisex Softstyle T-Shirt (White / XL)",
    "Gildan Unisex Softstyle T-Shirt (White / 2XL)",
    "Gildan Unisex Softstyle T-Shirt (White / 3XL)",
  ],
  hoodie: [
    "Gildan Unisex Hooded Sweatshirt (Black / S)",
    "Gildan Unisex Hooded Sweatshirt (Black / M)",
    "Gildan Unisex Hooded Sweatshirt (Black / L)",
    "Gildan Unisex Hooded Sweatshirt (Black / XL)",
    "Gildan Unisex Hooded Sweatshirt (Black / 2XL)",
    "Gildan Unisex Hooded Sweatshirt (Black / 3XL)",
    "Gildan Unisex Hooded Sweatshirt (White / S)",
    "Gildan Unisex Hooded Sweatshirt (White / M)",
    "Gildan Unisex Hooded Sweatshirt (White / L)",
    "Gildan Unisex Hooded Sweatshirt (White / 2XL)",
    "Gildan Unisex Hooded Sweatshirt (White / 3XL)",
  ],
  hat: [
    "Otto Cap Foam Trucker Hat (White / One size)",
    "Otto Cap Foam Trucker Hat (Black/White/Black / One size)",
  ],
  mug: ["Black Glossy Mug (11 oz)", "White Glossy Mug 11 oz"],
  mousepad: [
    "Gaming Mouse Pad (White / 18″×16″)",
    "Gaming Mouse Pad (White / 36″×18″)",
  ],
  sticker: [
    "Kiss Cut Vinyl Stickers (3″×3″in)",
    "Kiss Cut Vinyl Stickers (4″×4″in)",
    "Kiss Cut Vinyl Stickers (5.5″×5.5″in)",
    "Kiss Cut Vinyl Stickers (White / 15″×3.75″)",
    "Kiss-Cut Holographic Stickers (3″×3″in)",
    "Kiss-Cut Holographic Stickers (4″×4″in)",
    "Kiss-Cut Holographic Stickers (5.5″×5.5″in)",
  ],
};

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 0;
`;

const FormTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 120px;
`;

const Button = styled.button`
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 1rem;

  &:hover {
    background-color: var(--primary-dark);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);

  &:hover {
    background-color: rgba(255, 107, 129, 0.1);
  }
`;

const ProductPreview = styled.div`
  margin-top: 2rem;
  text-align: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  margin-bottom: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const CreateMerchandise = () => {
  const { id } = useParams(); // Character ID
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { character, loading: characterLoading } = useSelector(
    (state) => state.character,
  );
  const { loading: merchandiseLoading } = useSelector(
    (state) => state.merchandise,
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "t-shirt",
    productName: "",
    variantId: "",
    creatorRevenuePercent: 80,
  });

  useEffect(() => {
    if (!character || character._id !== id) {
      dispatch(getCharacterById(id));
    }
  }, [dispatch, id, character]);

  useEffect(() => {
    // Set default product when category changes
    if (
      formData.category &&
      PRODUCT_CATEGORIES[formData.category]?.length > 0
    ) {
      const defaultProduct = PRODUCT_CATEGORIES[formData.category][0];
      const variantId = PRODUCT_IDS[defaultProduct];
      const defaultPrice = PRODUCT_ID_RETAIL_PRICES[variantId];

      setFormData({
        ...formData,
        productName: defaultProduct,
        variantId: variantId,
        price: defaultPrice,
      });
    }
  }, [formData.category]);

  const onChange = (e) => {
    const { name, value } = e.target;

    if (name === "productName") {
      const variantId = PRODUCT_IDS[value];
      const fixedPrice = PRODUCT_ID_RETAIL_PRICES[variantId];

      setFormData({
        ...formData,
        [name]: value,
        variantId: variantId,
        price: fixedPrice,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Add character ID to form data
    const merchandiseData = {
      ...formData,
      character: id,
    };

    dispatch(createMerchandise(merchandiseData))
      .unwrap()
      .then(() => {
        navigate(`/characters/${id}`);
      })
      .catch((err) => {
        console.error("Error creating merchandise:", err);
      });
  };

  if (characterLoading) {
    return <Spinner />;
  }

  if (!character) {
    return (
      <FormContainer>
        <p>Character not found</p>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormTitle>Create Merchandise for {character.name}</FormTitle>
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label htmlFor="name">Merchandise Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={onChange}
            required
            placeholder="e.g., Character T-Shirt"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            name="description"
            id="description"
            value={formData.description}
            onChange={onChange}
            required
            placeholder="Describe your merchandise..."
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            type="number"
            name="price"
            id="price"
            min="0.01"
            step="0.01"
            value={formData.price}
            disabled
            required
          />
          <small>Price is set based on the selected product type.</small>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            type="url"
            name="imageUrl"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={onChange}
            required
            placeholder="https://example.com/image.jpg"
          />
        </FormGroup>

        {formData.imageUrl && (
          <ProductPreview>
            <PreviewImage src={formData.imageUrl} alt="Product preview" />
          </ProductPreview>
        )}

        <FormGroup>
          <Label htmlFor="category">Category</Label>
          <Select
            name="category"
            id="category"
            value={formData.category}
            onChange={onChange}
            required
          >
            <option value="t-shirt">T-Shirt</option>
            <option value="hoodie">Hoodie</option>
            <option value="mug">Mug</option>
            <option value="hat">Hat</option>
            <option value="mousepad">Mouse Pad</option>
            <option value="sticker">Sticker</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="productName">Product Type</Label>
          <Select
            name="productName"
            id="productName"
            value={formData.productName}
            onChange={onChange}
            required
          >
            {PRODUCT_CATEGORIES[formData.category]?.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="creatorRevenuePercent">Your Revenue Percentage</Label>
          <Input
            type="number"
            name="creatorRevenuePercent"
            id="creatorRevenuePercent"
            min="1"
            max="100"
            value={formData.creatorRevenuePercent}
            onChange={onChange}
            required
          />
          <small>Platform fee: {100 - formData.creatorRevenuePercent}%</small>
        </FormGroup>

        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={() => navigate(`/characters/${id}`)}
          >
            Cancel
          </CancelButton>
          <Button type="submit" disabled={merchandiseLoading}>
            {merchandiseLoading ? "Creating..." : "Create Merchandise"}
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default CreateMerchandise;
