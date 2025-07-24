# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WaifuHospital is a full-stack web application featuring anime-styled medical characters with AI-powered chat interactions and merchandise capabilities. It uses a microservices architecture with:
- **Frontend**: React SPA with Redux Toolkit state management
- **Backend**: Express/Node.js REST API with MongoDB
- **AI Service**: Microservice for OpenAI-powered character interactions

## Development Commands

### Full Stack (Docker Compose)
```bash
docker-compose up        # Start all services (MongoDB, backend, frontend, AI service)
docker-compose down      # Stop all services
docker-compose logs -f   # View logs from all services
docker-compose ps        # Check service status
```

### Individual Services
```bash
# Frontend (React) - Port 3000
cd frontend
npm start          # Development server with hot reload
npm run build      # Production build
npm test           # Run tests (interactive watch mode)

# Backend API (Express) - Port 5000
cd backend
npm run dev        # Development with Nodemon
npm start          # Production mode

# AI Service - Port 5001
cd ai_service
npm run dev        # Development with Nodemon
npm start          # Production mode
```

## Architecture & Key Design Patterns

### Microservices Communication
- Frontend → Backend: REST API calls via `frontend/src/utils/api.js` with JWT auth tokens
- Backend → AI Service: HTTP requests for chat/image generation
- AI Service → Backend: Fetches character data when needed

### Authentication Flow
1. JWT tokens stored in localStorage on frontend
2. Token sent via `x-auth-token` header on all authenticated requests
3. Backend middleware (`middleware/authMiddleware.js`) validates tokens
4. User object attached to `req.user` for authenticated routes

### State Management (Frontend)
Redux Toolkit with feature-based slices:
- **auth**: User authentication, login/logout, token management
- **characters**: Character CRUD operations, likes, public/private visibility
- **cart**: Shopping cart for merchandise
- **merchandise**: Product listings, Printful integration
- **alerts**: Global notification system

### AI Character System
1. **Character Creation**: User creates character → Backend generates intro message via AI Service
2. **Chat Flow**: Frontend → Backend `/api/chat/:characterId` → AI Service with character context
3. **Personality System**: Characters have `greedFactor` (0-5) that determines merchandise promotion frequency
4. **Image Generation**: AI Service uses OpenAI DALL-E for character images based on style/description

### External Service Integrations
- **Cloudflare Images**: Character image hosting with automatic upload/deletion
- **Stripe**: Payment processing with webhook handling
- **Printful**: Print-on-demand merchandise with mockup generation
- **Shopify**: E-commerce storefront integration

## API Routes Structure

### Backend Routes
- `/api/users` - User registration, login, profile management
- `/api/characters` - Character CRUD, likes, public browsing
- `/api/chat/:characterId` - Chat history and message sending
- `/api/merchandise` - Product listings and Printful integration
- `/api/payments` - Stripe payment processing

### AI Service Routes
- `/api/chat` - Generate AI responses for character conversations
- `/api/generate-image` - Create character images with DALL-E
- `/api/generate-intro` - Generate character introduction messages
- `/api/characters/:id` - Fetch character data from backend

## Environment Variables

Each service has its own `.env` file (see `.env.example` files in each directory):
- **Backend**: MongoDB URI, JWT secret, service API keys, Cloudflare credentials
- **Frontend**: Backend and AI service URLs (prefixed with `REACT_APP_`)
- **AI Service**: OpenAI API keys, backend URL

## Current Development Priorities

From `todo.md`, top priorities:
1. Stripe payment integration completion
2. Firebase authentication migration
3. Security implementations (captcha, rate limiting)
4. Merchandise marketplace with queue system for Printful API limits
5. Paywalling for image generation and conversation limits

## Important Technical Notes

- **No TypeScript** - Plain JavaScript throughout
- **No test infrastructure** - Tests not yet implemented
- **No linting** - Only frontend has ESLint (Create React App default)
- **Docker networking** - Services communicate using container names (e.g., `http://backend:5000`)
- **Character intro messages** - Auto-generated on creation, regenerated if personality changes
- **Image delivery** - Cloudflare Images used for CDN delivery of character images
- **Chat persistence** - Messages stored in MongoDB, intro message displayed on new chat creation