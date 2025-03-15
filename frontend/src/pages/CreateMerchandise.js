import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createMerchandise } from "../features/merchandise/merchandiseSlice";
import { getCharacterById } from "../features/characters/characterSlice";
import { generateProductMockups } from "../utils/api";
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

// Product category display names
const CATEGORY_DISPLAY_NAMES = {
  "t-shirt": "T-Shirt",
  hoodie: "Hoodie",
  hat: "Hat",
  mug: "Mug",
  mousepad: "Mouse Pad",
  sticker: "Sticker",
};

// Default product for each category
const DEFAULT_PRODUCTS = {
  "t-shirt": "Gildan Unisex Softstyle T-Shirt (Black / M)",
  hoodie: "Gildan Unisex Hooded Sweatshirt (Black / M)",
  hat: "Otto Cap Foam Trucker Hat (White / One size)",
  mug: "Black Glossy Mug (11 oz)",
  mousepad: "Gaming Mouse Pad (White / 18″×16″)",
  sticker: "Kiss Cut Vinyl Stickers (3″×3″in)",
};

// Default variant IDs for mockups
const DEFAULT_VARIANT_IDS = {
  "t-shirt": 505, // Black / M
  hoodie: 5531, // Black / M
  hat: 15905, // White / One size
  mug: 9323, // Black
  mousepad: 14943, // 18×16
  sticker: 10163, // 3×3
};

const FormContainer = styled.div`
  max-width: 1000px;
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
  margin-bottom: 2rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 1.1rem;
`;

const InfoText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ProductCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${(props) =>
    props.selected ? "rgba(255, 107, 129, 0.05)" : "white"};
  border-color: ${(props) =>
    props.selected ? "var(--primary-color)" : "#ddd"};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }
`;

const ProductImage = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f9f9f9;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const ProductInfo = styled.div`
  padding: 1rem;
`;

const ProductName = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
`;

const ProductPrice = styled.div`
  font-weight: 500;
  color: #555;
  margin-bottom: 0.5rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
  user-select: none;
`;

const MockupLoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  color: #999;
  font-size: 0.9rem;
`;

const RevenueInfo = styled.div`
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border: 1px solid #eee;
`;

const RevenueTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const RevenueText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
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

  &:hover {
    background-color: var(--primary-dark);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);

  &:hover {
    background-color: rgba(255, 107, 129, 0.1);
  }
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

  const [selectedCategories, setSelectedCategories] = useState({
    "t-shirt": false,
    hoodie: false,
    mug: false,
    hat: false,
    mousepad: false,
    sticker: false,
  });

  const [mockups, setMockups] = useState({});
  const [mockupLoading, setMockupLoading] = useState(false);
  const [mockupError, setMockupError] = useState(null);

  // Fixed creator revenue percentage
  const creatorRevenuePercent = 80;

  useEffect(() => {
    if (!character || character._id !== id) {
      dispatch(getCharacterById(id));
    }
  }, [dispatch, id, character]);

  useEffect(() => {
    // Generate mockups when character is loaded
    if (character && character.imageUrl) {
      generateMockups();
    }
  }, [character]);

  const generateMockups = async () => {
    if (!character || !character.imageUrl) return;

    setMockupLoading(true);
    setMockupError(null);

    try {
      // Generate mockups only for the first two product categories to reduce API load
      // We'll prioritize T-shirt and hoodie since they're the most popular
      const priorityCategories = ["t-shirt", "hoodie"];
      const otherCategories = Object.keys(DEFAULT_VARIANT_IDS).filter(
        (category) => !priorityCategories.includes(category),
      );

      // Only request the priority categories initially
      //const initialProducts = priorityCategories.map(category => ({
      //  category,
      //  variantId: DEFAULT_VARIANT_IDS[category],
      //  position: "front" // Default to front view
      //}));
      const mockupProductCategory = "t-shirt";
      const mockupProduct = {
        category: mockupProductCategory,
        variantId: DEFAULT_VARIANT_IDS[mockupProductCategory],
        position: "front",
      };

      // Call the mockup generation API with just the priority products
      const response = await generateProductMockups(
        character.imageUrl,
        mockupProduct,
      );

      if (response && response.mockups) {
        console.log("Initial mockups response: ", response);
        setMockups(response.mockups);
      }
    } catch (error) {
      console.error("Error generating mockups:", error);
      setMockupError(
        "Failed to generate product mockups. You can still create merchandise, but previews are unavailable.",
      );
      setMockups({});
    } finally {
      setMockupLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories({
      ...selectedCategories,
      [category]: !selectedCategories[category],
    });
  };

  const generateMerchandiseName = (category) => {
    if (!character) return "";
    return `${character.name} ${CATEGORY_DISPLAY_NAMES[category]}`;
  };

  const generateDescription = (category) => {
    if (!character) return "";
    return `Official ${CATEGORY_DISPLAY_NAMES[category]} featuring ${character.name}. High-quality merchandise with an exclusive design.`;
  };

  const getCategoryPrice = (category) => {
    const defaultProduct = DEFAULT_PRODUCTS[category];
    const variantId = PRODUCT_IDS[defaultProduct];
    return PRODUCT_ID_RETAIL_PRICES[variantId];
  };

  const getMockupUrl = (category) => {
    if (mockups && mockups[category] && mockups[category].length > 0) {
      // Try both mockupUrl (our custom property) and mockup_url (Printful's standard property)
      return mockups[category][0].mockupUrl || null;
    }

    return null;
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Create merchandise for each selected category
    const selectedCategoriesToCreate = Object.keys(selectedCategories).filter(
      (category) => selectedCategories[category],
    );

    if (selectedCategoriesToCreate.length === 0) {
      alert("Please select at least one product category");
      return;
    }

    // Create all selected merchandise items one after another
    const createAllItems = async () => {
      for (const category of selectedCategoriesToCreate) {
        const defaultProduct = DEFAULT_PRODUCTS[category];
        const variantId = PRODUCT_IDS[defaultProduct];
        const price = PRODUCT_ID_RETAIL_PRICES[variantId];

        const merchandiseData = {
          name: generateMerchandiseName(category),
          description: generateDescription(category),
          price: parseFloat(price),
          imageUrl: character.imageUrl, // Use character image
          category,
          productName: defaultProduct,
          variantId,
          creatorRevenuePercent,
          character: id,
        };

        try {
          await dispatch(createMerchandise(merchandiseData)).unwrap();
        } catch (err) {
          console.error(`Error creating ${category} merchandise:`, err);
        }
      }

      // Navigate back to character page after all items are created
      navigate(`/characters/${id}`);
    };

    createAllItems();
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
          <Label>Select Products to Create</Label>
          {mockupLoading ? (
            <MockupLoadingPlaceholder>
              Loading mockup...
            </MockupLoadingPlaceholder>
          ) : getMockupUrl("t-shirt") ? (
            <ProductImage>
              <img
                src={getMockupUrl("t-shirt")}
                alt={`${character.name} on ${CATEGORY_DISPLAY_NAMES["t-shirt"]}`}
              />
            </ProductImage>
          ) : (
            <MockupLoadingPlaceholder>
              {character.name} on {CATEGORY_DISPLAY_NAMES["t-shirt"]}
            </MockupLoadingPlaceholder>
          )}
          {mockupError && (
            <InfoText style={{ color: "#f44336" }}>{mockupError}</InfoText>
          )}

          <ProductsGrid>
            {Object.keys(CATEGORY_DISPLAY_NAMES).map((category) => (
              <ProductCard
                key={category}
                selected={selectedCategories[category]}
                onClick={() => toggleCategory(category)}
              >
                <ProductInfo>
                  <ProductName>{CATEGORY_DISPLAY_NAMES[category]}</ProductName>
                  <ProductPrice>
                    Sale Price: ${getCategoryPrice(category)}
                  </ProductPrice>
                  <CheckboxContainer>
                    <Checkbox
                      type="checkbox"
                      id={`category-${category}`}
                      checked={selectedCategories[category]}
                      onChange={() => toggleCategory(category)}
                    />
                    <CheckboxLabel htmlFor={`category-${category}`}>
                      Add to collection
                    </CheckboxLabel>
                  </CheckboxContainer>
                </ProductInfo>
              </ProductCard>
            ))}
          </ProductsGrid>

          <InfoText>
            Select the products you want to create using {character.name}'s
            image. All available sizes and colors will be included
            automatically.
          </InfoText>
        </FormGroup>

        <RevenueInfo>
          <RevenueTitle>Revenue Split</RevenueTitle>
          <RevenueText>
            <strong>Creator Revenue: {creatorRevenuePercent}%</strong> - You'll
            receive 80% of the profit after production costs.
          </RevenueText>
          <RevenueText>
            Platform Fee: {100 - creatorRevenuePercent}% - To cover processing,
            hosting, and support.
          </RevenueText>
        </RevenueInfo>

        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={() => navigate(`/characters/${id}`)}
          >
            Cancel
          </CancelButton>
          <Button type="submit" disabled={merchandiseLoading || mockupLoading}>
            {merchandiseLoading ? "Creating..." : "Create Merchandise"}
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default CreateMerchandise;
