import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCharacterById } from "../features/characters/characterSlice";
import api from "../utils/api";
import Spinner from "../components/layout/Spinner";
import styled from "styled-components";

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
  position: relative;
  overflow: hidden;
  height: 80px;
`;

const HeaderBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url(${(props) => props.image});
  background-size: cover;
  background-position: center;
  filter: blur(8px);
  opacity: 0.3;
  transform: scale(1.1);
`;

const CharacterImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 1rem;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
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
  flex-direction: ${(props) => (props.isUser ? "row-reverse" : "row")};
  align-items: flex-start;
  max-width: 80%;
  align-self: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
`;

const MessageContent = styled.div`
  flex: 1;
  min-width: 0; /* Prevents flex items from overflowing */
`;

const MessageBubble = styled.div`
  padding: 0.8rem 1rem;
  border-radius: 18px;
  background-color: ${(props) =>
    props.isUser ? "var(--primary-color)" : "white"};
  color: ${(props) => (props.isUser ? "white" : "var(--text-color)")};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  line-height: 1.4;
  word-wrap: break-word;
`;

const AvatarContainer = styled.div`
  flex: 0 0 auto; /* Prevents the avatar from shrinking */
  width: ${(props) => (props.isUser ? "32px" : "40px")};
  height: ${(props) => (props.isUser ? "32px" : "40px")};
  margin: ${(props) => (props.isUser ? "0 0 0 8px" : "0 8px 0 0")};
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
    0%,
    100% {
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

const SaveChatButton = styled.button`
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  z-index: 1;

  &:hover {
    background-color: var(--secondary-dark);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const SavedChatsButton = styled.button`
  background-color: transparent;
  color: white;
  border: 2px solid white;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
  margin-left: 0.5rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: 1rem;
  z-index: 1;
`;

const SavedChatsSidebar = styled.div`
  position: fixed;
  top: 0;
  right: ${(props) => (props.show ? "0" : "-350px")};
  width: 350px;
  height: 100vh;
  background-color: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.8;
  }
`;

const SavedChatsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const SavedChatItem = styled.div`
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--light-bg);
    border-color: var(--primary-color);
  }
`;

const SavedChatTitle = styled.div`
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.3rem;
`;

const SavedChatDate = styled.div`
  font-size: 0.8rem;
  color: var(--light-text);
`;

const NewChatButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin: 1rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--primary-dark);
  }
`;

const EmptySavedChats = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--light-text);
`;

const CharacterChat = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState({ messages: [] });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [showSavedChats, setShowSavedChats] = useState(false);
  const chatBodyRef = useRef(null);

  const dispatch = useDispatch();
  const { character, loading: characterLoading } = useSelector(
    (state) => state.character,
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getCharacterById(id));

    // Fetch chat history or create a new chat
    const fetchChat = async () => {
      try {
        const res = await api.get(`/api/chat/${id}`);
        setChat(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chat:", error);
        setLoading(false);
      }
    };

    // Fetch saved chats for this character
    const fetchSavedChats = async () => {
      try {
        const res = await api.get(`/api/saved-chats/character/${id}`);
        setSavedChats(res.data);
      } catch (error) {
        console.error("Error fetching saved chats:", error);
      }
    };

    if (user) {
      fetchChat();
      fetchSavedChats();
    }
  }, [dispatch, id, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const handleSaveChat = async () => {
    if (chat.messages.length <= 1) {
      return;
    }

    setSaving(true);
    try {
      const res = await api.post(`/api/saved-chats/${id}`);
      setSavedChats([res.data, ...savedChats]);
      // Automatically open the saved chats sidebar to show the new save
      setShowSavedChats(true);
    } catch (error) {
      console.error("Error saving chat:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSavedChat = async (savedChatId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/chat/${id}?savedChatId=${savedChatId}`);
      setChat(res.data);
      setShowSavedChats(false);
    } catch (error) {
      console.error("Error loading saved chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/chat/${id}`);
      setChat(res.data);
      setShowSavedChats(false);
    } catch (error) {
      console.error("Error starting new chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Add user message to chat
    const updatedMessages = [
      ...chat.messages,
      { sender: "user", content: message },
    ];

    setChat((prev) => ({
      ...prev,
      messages: updatedMessages,
    }));

    setMessage("");
    setSending(true);

    try {
      // Send message via backend API
      const res = await api.post(`/api/chat/${id}`, { message });
      
      // Update the entire chat with the response
      setChat(res.data);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message to chat
      setChat((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { sender: "character", content: "Sorry, I'm having trouble responding right now. Please try again later." },
        ],
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
    <>
      <ChatContainer>
        <ChatHeader>
          <HeaderBackground image={character.imageUrl} />
          <CharacterImage src={character.imageUrl} alt={character.name} />
          <CharacterName>{character.name}</CharacterName>
          <HeaderButtons>
            <SaveChatButton onClick={handleSaveChat} disabled={saving || chat.messages.length <= 1}>
              {saving ? "Saving..." : "Remember this chat"}
            </SaveChatButton>
            <SavedChatsButton onClick={() => setShowSavedChats(true)}>
              Saved Chats ({savedChats.length})
            </SavedChatsButton>
          </HeaderButtons>
          <BackLink to={`/characters/${id}`}>Back to Profile</BackLink>
        </ChatHeader>

      <ChatBody ref={chatBodyRef}>
        {chat.messages.length === 0 ? (
          <EmptyChat>
            <EmptyTitle>Start Chatting with {character.name}</EmptyTitle>
            <EmptyText>
              Say hello to start a conversation! {character.name} is excited to
              talk with you.
            </EmptyText>
          </EmptyChat>
        ) : (
          chat.messages.map((msg, index) => (
            <MessageContainer key={index} isUser={msg.sender === "user"}>
              <AvatarContainer isUser={msg.sender === "user"}>
                {msg.sender === "user" ? (
                  <UserAvatar>
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </UserAvatar>
                ) : (
                  <Avatar src={character.imageUrl} alt={character.name} />
                )}
              </AvatarContainer>
              <MessageContent>
                <MessageBubble isUser={msg.sender === "user"}>
                  {msg.content}
                </MessageBubble>
              </MessageContent>
            </MessageContainer>
          ))
        )}

        {sending && (
          <MessageContainer>
            <AvatarContainer>
              <Avatar src={character.imageUrl} alt={character.name} />
            </AvatarContainer>
            <MessageContent>
              <ThinkingIndicator>
                <span></span>
                <span></span>
                <span></span>
              </ThinkingIndicator>
            </MessageContent>
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

    <SavedChatsSidebar show={showSavedChats}>
      <SidebarHeader>
        <SidebarTitle>Saved Chats</SidebarTitle>
        <CloseButton onClick={() => setShowSavedChats(false)}>×</CloseButton>
      </SidebarHeader>
      <NewChatButton onClick={handleStartNewChat}>
        Start New Chat
      </NewChatButton>
      <SavedChatsList>
        {savedChats.length === 0 ? (
          <EmptySavedChats>
            No saved chats yet. Click "Remember this chat" to save your conversations!
          </EmptySavedChats>
        ) : (
          savedChats.map((savedChat) => (
            <SavedChatItem
              key={savedChat._id}
              onClick={() => handleLoadSavedChat(savedChat._id)}
            >
              <SavedChatTitle>{savedChat.title}</SavedChatTitle>
              <SavedChatDate>
                {new Date(savedChat.savedAt).toLocaleDateString()} at{" "}
                {new Date(savedChat.savedAt).toLocaleTimeString()}
              </SavedChatDate>
            </SavedChatItem>
          ))
        )}
      </SavedChatsList>
    </SavedChatsSidebar>
  </>
  );
};

export default CharacterChat;
