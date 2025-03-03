import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserCharacters } from '../features/characters/characterSlice';
import { getCreatorMerchandise } from '../features/merchandise/merchandiseSlice';
import { getUserOrders } from '../features/cart/cartSlice';
import Spinner from '../components/layout/Spinner';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 2rem 0;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const DashboardTitle = styled.h1`
  font-size: 2.5rem;
  margin: 0;
`;

const CreateButton = styled(Link)`
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

const DashboardSection = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const CardContent = styled.div`
  padding: 1.2rem;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: var(--text-color);
`;

const CardText = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: var(--light-text);
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--primary-dark);
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: var(--light-text);
  font-size: 1.1rem;
  margin: 2rem 0;
`;

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector(state => state.auth);
  const { userCharacters, loading: charactersLoading } = useSelector(state => state.character);
  const { creatorMerchandise, loading: merchandiseLoading } = useSelector(state => state.merchandise);
  const { orders, loading: ordersLoading } = useSelector(state => state.cart);

  useEffect(() => {
    dispatch(getUserCharacters());
    dispatch(getCreatorMerchandise());
    dispatch(getUserOrders());
  }, [dispatch, user]);

  if (authLoading || charactersLoading || merchandiseLoading || ordersLoading) {
    return <Spinner />;
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle>Dashboard</DashboardTitle>
        {user && (
          <CreateButton to="/create-character">Create Character</CreateButton>
        )}
      </DashboardHeader>

      <DashboardSection>
        <SectionTitle>My Characters</SectionTitle>
        {userCharacters && userCharacters.length > 0 ? (
          <Grid>
            {userCharacters.map(character => (
              <CardLink to={`/characters/${character._id}`} key={character._id}>
                <Card>
                  <CardImage src={character.imageUrl} alt={character.name} />
                  <CardContent>
                    <CardTitle>{character.name}</CardTitle>
                    <CardText>{character.personality.substring(0, 100)}...</CardText>
                  </CardContent>
                </Card>
              </CardLink>
            ))}
          </Grid>
        ) : (
          <EmptyMessage>
            You haven't created any characters yet. 
            <span> <Link to="/create-character">Create your first character!</Link></span>
          </EmptyMessage>
        )}
      </DashboardSection>

      <DashboardSection>
        <SectionTitle>My Merchandise</SectionTitle>
        {creatorMerchandise && creatorMerchandise.length > 0 ? (
          <Grid>
            {creatorMerchandise.map(item => (
              <CardLink to={`/merchandise/${item._id}`} key={item._id}>
                <Card>
                  <CardImage src={item.imageUrl} alt={item.name} />
                  <CardContent>
                    <CardTitle>{item.name}</CardTitle>
                    <CardText>${item.price.toFixed(2)}</CardText>
                    <CardText>Sold: {item.sold}</CardText>
                  </CardContent>
                </Card>
              </CardLink>
            ))}
          </Grid>
        ) : (
          <EmptyMessage>
            You haven't created any merchandise yet. 
            {userCharacters && userCharacters.length > 0 ? (
              <span> Go to one of your characters to create merchandise.</span>
            ) : (
              <span> Create a character first to start selling merchandise.</span>
            )}
          </EmptyMessage>
        )}
      </DashboardSection>

      <DashboardSection>
        <SectionTitle>My Orders</SectionTitle>
        {orders && orders.length > 0 ? (
          <Grid>
            {orders.map(order => (
              <Card key={order._id}>
                <CardContent>
                  <CardTitle>Order #{order._id.substring(order._id.length - 6)}</CardTitle>
                  <CardText>Items: {order.items.length}</CardText>
                  <CardText>Total: ${order.totalAmount.toFixed(2)}</CardText>
                  <CardText>Status: {order.status}</CardText>
                  <Link to={`/orders/${order._id}`}>
                    <Button>View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </Grid>
        ) : (
          <EmptyMessage>
            You haven't placed any orders yet. <Link to="/merchandise">Browse the store</Link>
          </EmptyMessage>
        )}
      </DashboardSection>
    </DashboardContainer>
  );
};

export default Dashboard;