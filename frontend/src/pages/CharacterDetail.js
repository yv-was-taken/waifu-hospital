import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCharacterById, likeCharacter, unlikeCharacter, deleteCharacter } from '../features/characters/characterSlice';
import { getCharacterMerchandise } from '../features/merchandise/merchandiseSlice';
import { setAlert } from '../features/alerts/alertSlice';
import Spinner from '../components/layout/Spinner';
import styled from 'styled-components';

const CharacterContainer = styled.div`
  padding: 2rem 0;
`;

const CharacterHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ImageContainer = styled.div`
  flex: 0 0 350px;

  @media (max-width: 768px) {
    flex: 1 0 100%;
  }
`;

const CharacterImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const CharacterInfo = styled.div`
  flex: 1;
`;

const CharacterName = styled.h1`
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  color: var(--primary-color);
`;

const CreatorInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CreatorLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
`;

const CreatorAvatar = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 0.5rem;
`;

const CharacterStyle = styled.div`
  display: inline-block;
  background-color: var(--secondary-color);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  margin: 0 0.5rem 0.5rem 0;
`;

const CharacterDescription = styled.p`
  margin: 1.5rem 0;
  line-height: 1.6;
`;

const CharacterStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  color: var(--light-text);
`;

const StatValue = styled.span`
  font-weight: 500;
  margin-left: 0.3rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background-color: ${props => props.secondary ? 'transparent' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary ? '1px solid var(--primary-color)' : 'none'};
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${props => props.secondary ? 'rgba(255, 107, 129, 0.1)' : 'var(--primary-dark)'};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const LinkButton = styled(Link)`
  background-color: ${props => props.secondary ? 'transparent' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary ? '1px solid var(--primary-color)' : 'none'};
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${props => props.secondary ? 'rgba(255, 107, 129, 0.1)' : 'var(--primary-dark)'};
  }
`;

const DangerButton = styled(Button)`
  background-color: ${props => props.secondary ? 'transparent' : 'var(--error-color)'};
  border-color: var(--error-color);
  color: ${props => props.secondary ? 'var(--error-color)' : 'white'};

  &:hover {
    background-color: ${props => props.secondary ? 'rgba(214, 48, 49, 0.1)' : '#c0392b'};
  }
`;

const TabContainer = styled.div`
  margin-top: 2rem;
`;

const TabButtons = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2rem;
`;

const TabButton = styled.button`
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  color: ${props => props.active ? 'var(--primary-color)' : 'var(--light-text)'};
  border-bottom: ${props => props.active ? '3px solid var(--primary-color)' : '3px solid transparent'};
  transition: all 0.3s ease;

  &:hover {
    color: var(--primary-color);
  }
`;

const TabContent = styled.div`
  margin-bottom: 2rem;
`;

const DetailItem = styled.div`
  margin-bottom: 1.5rem;
`;

const DetailTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const DetailText = styled.p`
  margin: 0;
  line-height: 1.5;
  color: var(--light-text);
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  background-color: var(--light-bg);
  color: var(--light-text);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const MerchandiseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
`;

const MerchandiseCard = styled(Link)`
  text-decoration: none;
  color: inherit;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const MerchandiseImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const MerchandiseContent = styled.div`
  padding: 1rem;
`;

const MerchandiseTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const MerchandisePrice = styled.p`
  margin: 0;
  font-weight: 600;
  color: var(--primary-color);
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: var(--light-text);
  font-size: 1.1rem;
  margin: 2rem 0;
`;

const ConfirmationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  color: var(--error-color);
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const CharacterDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('details');
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const { character, loading } = useSelector(state => state.character);
  const { characterMerchandise, loading: merchandiseLoading } = useSelector(state => state.merchandise);
  const { user, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(getCharacterById(id));
    dispatch(getCharacterMerchandise(id));
  }, [dispatch, id]);

  const handleLike = () => {
    if (!isAuthenticated) {
      dispatch(setAlert({
        msg: 'You need to be logged in to like characters',
        type: 'info'
      }));
      return;
    }
    
    if (character.likedBy && character.likedBy.some(userId => userId === user._id)) {
      dispatch(unlikeCharacter(id));
    } else {
      dispatch(likeCharacter(id));
    }
  };

  const handleDelete = () => {
    dispatch(deleteCharacter(id));
    setShowDeleteModal(false);
    navigate('/dashboard');
  };

  // Check if user is the creator of this character
  const isCreator = character && user && character.creator._id === user._id;

  if (loading || merchandiseLoading) {
    return <Spinner />;
  }

  if (!character) {
    return (
      <CharacterContainer>
        <EmptyMessage>Character not found</EmptyMessage>
      </CharacterContainer>
    );
  }

  const isLiked = character.likedBy && user && character.likedBy.some(userId => userId === user._id);

  return (
    <CharacterContainer>
      <CharacterHeader>
        <ImageContainer>
          <CharacterImage src={character.imageUrl} alt={character.name} />
        </ImageContainer>
        <CharacterInfo>
          <CharacterName>{character.name}</CharacterName>
          <CreatorInfo>
            <CreatorLink to={`/users/${character.creator._id}`}>
              {character.creator.profilePicture && (
                <CreatorAvatar src={character.creator.profilePicture} alt={character.creator.username} />
              )}
              {character.creator.username}
            </CreatorLink>
          </CreatorInfo>
          <CharacterStyle>{character.style}</CharacterStyle>
          <CharacterDescription>{character.description}</CharacterDescription>

          <CharacterStats>
            <Stat>
              Likes: <StatValue>{character.likes}</StatValue>
            </Stat>
          </CharacterStats>

          <ActionButtons>
            {isAuthenticated && (
              <Button onClick={handleLike} secondary={isLiked}>
                {isLiked ? 'Unlike' : 'Like'}
              </Button>
            )}
            <LinkButton to={`/characters/${character._id}/chat`}>Chat with {character.name}</LinkButton>
            {isCreator && (
              <>
                <LinkButton to={`/characters/${character._id}/edit`} secondary>Edit</LinkButton>
                <DangerButton secondary onClick={() => setShowDeleteModal(true)}>Delete</DangerButton>
              </>
            )}
          </ActionButtons>
        </CharacterInfo>
      </CharacterHeader>

      <TabContainer>
        <TabButtons>
          <TabButton 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')}
          >
            Details
          </TabButton>
          <TabButton 
            active={activeTab === 'merchandise'} 
            onClick={() => setActiveTab('merchandise')}
          >
            Merchandise
          </TabButton>
        </TabButtons>

        {activeTab === 'details' && (
          <TabContent>
            <DetailItem>
              <DetailTitle>Personality</DetailTitle>
              <DetailText>{character.personality}</DetailText>
            </DetailItem>
            {character.background && (
              <DetailItem>
                <DetailTitle>Background</DetailTitle>
                <DetailText>{character.background}</DetailText>
              </DetailItem>
            )}
            {character.occupation && (
              <DetailItem>
                <DetailTitle>Occupation</DetailTitle>
                <DetailText>{character.occupation}</DetailText>
              </DetailItem>
            )}
            {character.age !== undefined && (
              <DetailItem>
                <DetailTitle>Age</DetailTitle>
                <DetailText>{character.age}</DetailText>
              </DetailItem>
            )}
            {character.interests && character.interests.length > 0 && (
              <DetailItem>
                <DetailTitle>Interests</DetailTitle>
                <TagsContainer>
                  {character.interests.map((interest, index) => (
                    <Tag key={index}>{interest}</Tag>
                  ))}
                </TagsContainer>
              </DetailItem>
            )}
          </TabContent>
        )}

        {activeTab === 'merchandise' && (
          <TabContent>
            {isCreator && (
              <ActionButtons style={{ marginBottom: '2rem' }}>
                <LinkButton to={`/characters/${character._id}/create-merchandise`}>Create Merchandise</LinkButton>
              </ActionButtons>
            )}
            
            {characterMerchandise && characterMerchandise.length > 0 ? (
              <MerchandiseGrid>
                {characterMerchandise.map(item => (
                  <MerchandiseCard to={`/merchandise/${item._id}`} key={item._id}>
                    <MerchandiseImage src={item.imageUrl} alt={item.name} />
                    <MerchandiseContent>
                      <MerchandiseTitle>{item.name}</MerchandiseTitle>
                      <MerchandisePrice>${item.price.toFixed(2)}</MerchandisePrice>
                    </MerchandiseContent>
                  </MerchandiseCard>
                ))}
              </MerchandiseGrid>
            ) : (
              <EmptyMessage>
                No merchandise available for this character yet.
                {isCreator && ' Create some merchandise to start selling!'}
              </EmptyMessage>
            )}
          </TabContent>
        )}
      </TabContainer>

      {showDeleteModal && (
        <ConfirmationModal>
          <ModalContent>
            <ModalTitle>Delete Character</ModalTitle>
            <p>Are you sure you want to delete {character.name}? This action cannot be undone.</p>
            <ModalButtons>
              <Button secondary onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <DangerButton onClick={handleDelete}>Delete</DangerButton>
            </ModalButtons>
          </ModalContent>
        </ConfirmationModal>
      )}
    </CharacterContainer>
  );
};

export default CharacterDetail;