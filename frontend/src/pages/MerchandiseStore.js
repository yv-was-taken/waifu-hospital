import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMerchandise } from "../features/merchandise/merchandiseSlice";
import Spinner from "../components/layout/Spinner";
import styled from "styled-components";

const StoreContainer = styled.div`
  padding: 2rem 0;
`;

const StoreHeader = styled.div`
  margin-bottom: 2rem;
`;

const StoreTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text-color);
`;

const StoreDescription = styled.p`
  color: var(--light-text);
  font-size: 1.1rem;
  max-width: 800px;
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;

const ProductCard = styled(Link)`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
  text-decoration: none;
  color: var(--text-color);

  &:hover {
    transform: translateY(-5px);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  padding: 1.2rem;
`;

const ProductTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
`;

const ProductPrice = styled.p`
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
`;

const ProductCategory = styled.span`
  display: inline-block;
  background-color: var(--light-bg);
  color: var(--light-text);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
`;

const ProductCreator = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--light-text);
`;

const CreatorImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 0.5rem;
`;

const CharacterBadge = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.8rem;
  font-size: 0.9rem;
`;

const CharacterImage = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 0.5rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EmptyTitle = styled.h2`
  color: var(--text-color);
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: var(--light-text);
  margin-bottom: 1.5rem;
`;

const MerchandiseStore = () => {
  const dispatch = useDispatch();
  const { merchandise, loading } = useSelector((state) => state.merchandise);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: "all",
    priceRange: "all",
    sortBy: "newest",
  });

  useEffect(() => {
    dispatch(getMerchandise());
  }, [dispatch]);

  useEffect(() => {
    if (merchandise) {
      let filtered = [...merchandise];

      // Apply category filter
      if (filters.category !== "all") {
        filtered = filtered.filter(
          (item) => item.category === filters.category,
        );
      }

      // Apply price range filter
      if (filters.priceRange !== "all") {
        switch (filters.priceRange) {
          case "under25":
            filtered = filtered.filter((item) => item.price < 25);
            break;
          case "25to50":
            filtered = filtered.filter(
              (item) => item.price >= 25 && item.price <= 50,
            );
            break;
          case "over50":
            filtered = filtered.filter((item) => item.price > 50);
            break;
          default:
            break;
        }
      }

      // Apply sorting
      switch (filters.sortBy) {
        case "newest":
          filtered.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
          break;
        case "priceAsc":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "priceDesc":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "popularity":
          filtered.sort((a, b) => b.sold - a.sold);
          break;
        default:
          break;
      }

      setFilteredProducts(filtered);
    }
  }, [merchandise, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <StoreContainer>
      <StoreHeader>
        <StoreTitle>Merchandise Store</StoreTitle>
        <StoreDescription>
          Browse and shop for merchandise featuring your favorite characters.
          From t-shirts to posters, find unique items created by our community.
        </StoreDescription>
      </StoreHeader>

      <FilterContainer>
        <FilterGroup>
          <FilterLabel htmlFor="category">Category</FilterLabel>
          <FilterSelect
            id="category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="all">All Categories</option>
            <option value="t-shirt">T-Shirts</option>
            <option value="mug">Mugs</option>
            <option value="poster">Posters</option>
            <option value="sticker">Stickers</option>
            <option value="hoodie">Hoodies</option>
            <option value="hat">Hats</option>
            <option value="phonecase">Phone Cases</option>
            <option value="other">Other</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel htmlFor="priceRange">Price Range</FilterLabel>
          <FilterSelect
            id="priceRange"
            name="priceRange"
            value={filters.priceRange}
            onChange={handleFilterChange}
          >
            <option value="all">All Prices</option>
            <option value="under25">Under $25</option>
            <option value="25to50">$25 - $50</option>
            <option value="over50">Over $50</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel htmlFor="sortBy">Sort By</FilterLabel>
          <FilterSelect
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
          >
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="popularity">Popularity</option>
          </FilterSelect>
        </FilterGroup>
      </FilterContainer>

      {filteredProducts.length > 0 ? (
        <ProductGrid>
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} to={`/merchandise/${product._id}`}>
              <ProductImage src={product.imageUrl} alt={product.name} />
              <ProductInfo>
                <ProductTitle>{product.name}</ProductTitle>
                <ProductPrice>${product.price.toFixed(2)}</ProductPrice>
                <ProductCategory>{product.category}</ProductCategory>

                {product.character && (
                  <CharacterBadge>
                    <CharacterImage
                      src={product.character.imageUrl}
                      alt={product.character.name}
                    />
                    {product.character.name}
                  </CharacterBadge>
                )}

                {product.creator && (
                  <ProductCreator>
                    {product.creator.profilePicture && (
                      <CreatorImage
                        src={product.creator.profilePicture}
                        alt={product.creator.username}
                      />
                    )}
                    by {product.creator.username}
                  </ProductCreator>
                )}
              </ProductInfo>
            </ProductCard>
          ))}
        </ProductGrid>
      ) : (
        <EmptyMessage>
          <EmptyTitle>No Products Found</EmptyTitle>
          <EmptyText>
            Try adjusting your filters or check back later for new merchandise.
          </EmptyText>
        </EmptyMessage>
      )}
    </StoreContainer>
  );
};

export default MerchandiseStore;
