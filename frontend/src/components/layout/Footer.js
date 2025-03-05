import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const FooterContainer = styled.footer`
  background-color: var(--light-bg);
  padding: 2rem 0;
  margin-top: 3rem;
`;

const FooterContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const FooterTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
`;

const FooterLink = styled(Link)`
  color: var(--light-text);
  margin-bottom: 0.5rem;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: var(--primary-color);
  }
`;

const FooterText = styled.p`
  color: var(--light-text);
  margin-bottom: 0.5rem;
`;

const FooterBottom = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 1rem 20px 0;
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--light-text);
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterTitle>WaifuHospital</FooterTitle>
          <FooterText>
            Create, chat with, and merchandise your own AI anime characters.
          </FooterText>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Explore</FooterTitle>
          <FooterLink to="/">Home</FooterLink>
          <FooterLink to="/merchandise">Store</FooterLink>
          <FooterLink to="/dashboard">Dashboard</FooterLink>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Create</FooterTitle>
          <FooterLink to="/create-character">Create Character</FooterLink>
          <FooterLink to="/dashboard">Manage Characters</FooterLink>
          <FooterLink to="/dashboard">Sell Merchandise</FooterLink>
        </FooterSection>

        <FooterSection>
          <FooterTitle>Help</FooterTitle>
          <FooterLink to="/">FAQ</FooterLink>
          <FooterLink to="/">Terms of Service</FooterLink>
          <FooterLink to="/">Privacy Policy</FooterLink>
          <FooterLink to="/">Contact Us</FooterLink>
        </FooterSection>
      </FooterContent>

      <FooterBottom>
        <FooterText>
          &copy; {new Date().getFullYear()} WaifuHospital. All rights reserved.
        </FooterText>
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;
