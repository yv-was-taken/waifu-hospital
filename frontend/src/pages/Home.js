import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getPopularCharacters } from "../features/characters/characterSlice";
import Spinner from "../components/layout/Spinner";
import styled from "styled-components";

const Hero = styled.section`
  background-color: var(--secondary-color);
  color: white;
  padding: 4rem 0;
  margin-bottom: 3rem;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
    width: 80%;
    margin: 0 auto;
  }
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
`;

const PrimaryButton = styled(Button)`
  background-color: white;
  color: var(--secondary-color);

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  border: 1px solid white;
  color: white;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FeatureCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
`;

const FeatureText = styled.p`
  color: var(--light-text);
`;

const CharactersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const CharacterCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CharacterImage = styled.img`
  width: 100%;
  height: 250px;
  object-fit: cover;
`;

const CharacterInfo = styled.div`
  padding: 1.5rem;
`;

const CharacterName = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const CharacterCreator = styled.p`
  color: var(--light-text);
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const CharacterButton = styled(Link)`
  display: block;
  background-color: var(--primary-color);
  color: white;
  text-align: center;
  padding: 0.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--primary-dark);
  }
`;

const Home = () => {
  const dispatch = useDispatch();
  const { popularCharacters, loading } = useSelector(
    (state) => state.character,
  );
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getPopularCharacters());
  }, [dispatch]);

  return (
    <>
      <Hero>
        <HeroContent>
          <HeroTitle>Create Your Perfect Anime Companion</HeroTitle>
          <HeroSubtitle>
            Design, chat with, and own merchandise of your custom AI-generated
            anime characters
          </HeroSubtitle>
          <ButtonGroup>
            {isAuthenticated ? (
              <>
                <PrimaryButton to="/dashboard">My Dashboard</PrimaryButton>
                {user && user.isCreator ? (
                  <SecondaryButton to="/create-character">
                    Create Character
                  </SecondaryButton>
                ) : (
                  <SecondaryButton to="/merchandise">
                    Browse Store
                  </SecondaryButton>
                )}
              </>
            ) : (
              <>
                <PrimaryButton to="/register">Get Started</PrimaryButton>
                <SecondaryButton to="/login">Sign In</SecondaryButton>
              </>
            )}
          </ButtonGroup>
        </HeroContent>
      </Hero>

      <Section>
        <SectionTitle>How It Works</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureTitle>Create</FeatureTitle>
            <FeatureText>
              Design your own anime character with our AI-powered creator.
              Choose styles, personality, and more.
            </FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>Chat</FeatureTitle>
            <FeatureText>
              Engage in meaningful conversations with your character. They'll
              remember your interactions!
            </FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>Customize</FeatureTitle>
            <FeatureText>
              Add details to your character's background, interests, and story
              to make them unique.
            </FeatureText>
          </FeatureCard>
          <FeatureCard>
            <FeatureTitle>Merchandise</FeatureTitle>
            <FeatureText>
              Create and sell custom merchandise featuring your character.
              T-shirts, mugs, and more!
            </FeatureText>
          </FeatureCard>
        </FeaturesGrid>
      </Section>

      <Section>
        <SectionTitle>Popular Characters</SectionTitle>
        {loading ? (
          <Spinner />
        ) : popularCharacters.length > 0 ? (
          <CharactersGrid>
            {popularCharacters.slice(0, 8).map((character) => (
              <CharacterCard key={character._id}>
                <CharacterImage src={character.imageUrl} alt={character.name} />
                <CharacterInfo>
                  <CharacterName>{character.name}</CharacterName>
                  <CharacterCreator>
                    by {character.creator?.username || "Unknown"}
                  </CharacterCreator>
                  <CharacterButton to={`/characters/${character._id}`}>
                    View Character
                  </CharacterButton>
                </CharacterInfo>
              </CharacterCard>
            ))}
          </CharactersGrid>
        ) : (
          <p className="text-center">
            No characters found. Be the first to create one!
          </p>
        )}
      </Section>
    </>
  );
};

export default Home;
