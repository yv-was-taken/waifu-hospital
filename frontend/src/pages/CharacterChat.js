import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCharacterById } from '../features/characters/characterSlice';
import axios from 'axios';
import Spinner from '../components/layout/Spinner';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 2rem 0;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
`;

const CharacterImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 1rem;
  object-fit: cover;
`;

const CharacterName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const BackLink = styled(Link)`
  margin-left: auto;
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--light-bg);
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  align-items: flex-start;
  max-width: 80%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div`
  padding: 0.8rem 1rem;
  border-radius: 18px;
  background-color: ${props => props.isUser ? 'var(--primary-color)' : 'white'};
  color: ${props => props.isUser ? 'white' : 'var(--text-color)'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  line-height: 1.4;
`;

const AvatarContainer = styled.div`
  width: 32px;
  height: 32px;
  margin: ${props => props.isUser ? '0 0 0 8px' : '0 8px 0 0'};
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

const UserAvatar = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

const ThinkingIndicator = styled.div`
  display: flex;
  padding: 0.5rem;
  gap: 0.3rem;
  align-items: center;
  
  span {
    width: 8px;
    height: 8px;
    background-color: var(--light-text);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }
`;

const ChatFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background-color: white;
`;

const MessageForm = styled.form`
  display: flex;
  gap: 0.5rem;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const SendButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 24px;
  padding: 0 1.2rem;
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

const EmptyChat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--light-text);
  text-align: center;
  padding: 2rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const EmptyText = styled.p`
  max-width: 400px;
`;

const CharacterChat = () => {
  const { id } = useParams();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState({ messages: [] });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatBodyRef = useRef(null);
  
  const dispatch = useDispatch();
  const { character, loading: characterLoading } = useSelector(state => state.character);
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    dispatch(getCharacterById(id));
    
    // Fetch chat history or create a new chat
    const fetchChat = async () => {
      try {
        // In a real app, this would call the backend API
        // For this MVP, we'll simulate it
        setTimeout(() => {
          setChat({
            _id: 'chat_' + id,
            character: id,
            user: user?._id,
            messages: []
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching chat:', error);
        setLoading(false);
      }
    };
    
    fetchChat();
  }, [dispatch, id, user]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chat.messages]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const updatedMessages = [
      ...chat.messages,
      { sender: 'user', content: message }
    ];
    
    setChat(prev => ({
      ...prev,
      messages: updatedMessages
    }));
    
    setMessage('');
    setSending(true);
    
    try {
      // Call the AI service API
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: message,
        characterId: id
      });
      
      if (response.data && response.data.response) {
        setChat(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            { sender: 'character', content: response.data.response }
          ]
        }));
      } else {
        throw new Error('Invalid response from AI service');
      }
    } catch (error) {
      console.error('Error sending message to AI service:', error);
      
      // Fallback to static responses if AI service fails
      const fallbackResponses = [
        `That's interesting! Tell me more about it.`,
        `I see. How does that make you feel?`,
        `Hmm, I never thought about it that way.`,
        `That's cool! I'd like to know more about you.`,
        `That sounds wonderful! What else do you enjoy?`,
        `Really? That's fascinating!`,
        `I understand. Let's talk more about that.`,
        `That's a good point. I appreciate your perspective.`,
        `Thanks for sharing that with me!`,
        `I'm glad you told me that. It helps me understand you better.`
      ];
      
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      setChat(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { sender: 'character', content: fallbackResponse }
        ]
      }));
    } finally {
      setSending(false);
    }
  };
  
  if (characterLoading || loading) {
    return <Spinner />;
  }
  
  if (!character) {
    return <div>Character not found</div>;
  }
  
  return (
    <ChatContainer>
      <ChatHeader>
        <CharacterImage src={character.imageUrl} alt={character.name} />
        <CharacterName>{character.name}</CharacterName>
        <BackLink to={`/characters/${id}`}>Back to Profile</BackLink>
      </ChatHeader>
      
      <ChatBody ref={chatBodyRef}>
        {chat.messages.length === 0 ? (
          <EmptyChat>
            <EmptyTitle>Start Chatting with {character.name}</EmptyTitle>
            <EmptyText>
              Say hello to start a conversation! {character.name} is excited to talk with you.
            </EmptyText>
          </EmptyChat>
        ) : (
          chat.messages.map((msg, index) => (
            <MessageContainer key={index} isUser={msg.sender === 'user'}>
              <AvatarContainer isUser={msg.sender === 'user'}>
                {msg.sender === 'user' ? (
                  <UserAvatar>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </UserAvatar>
                ) : (
                  <Avatar src={character.imageUrl} alt={character.name} />
                )}
              </AvatarContainer>
              <MessageBubble isUser={msg.sender === 'user'}>
                {msg.content}
              </MessageBubble>
            </MessageContainer>
          ))
        )}
        
        {sending && (
          <MessageContainer>
            <AvatarContainer>
              <Avatar src={character.imageUrl} alt={character.name} />
            </AvatarContainer>
            <ThinkingIndicator>
              <span></span>
              <span></span>
              <span></span>
            </ThinkingIndicator>
          </MessageContainer>
        )}
      </ChatBody>
      
      <ChatFooter>
        <MessageForm onSubmit={handleSubmit}>
          <MessageInput
            type="text"
            placeholder={`Message ${character.name}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />
          <SendButton type="submit" disabled={sending || !message.trim()}>
            Send
          </SendButton>
        </MessageForm>
      </ChatFooter>
    </ChatContainer>
  );
};

export default CharacterChat;