# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WaifuHospital is a full-stack web application featuring anime-styled medical characters. It uses a microservices architecture with three main components:
- **Frontend**: React SPA with Redux state management
- **Backend**: Express/Node.js REST API with MongoDB
- **AI Service**: Microservice for AI-powered character interactions using OpenAI

## Development Commands

### Full Stack (Docker Compose)
```bash
# Start all services (MongoDB, backend, frontend, AI service)
docker-compose up

# Stop all services
docker-compose down
```

### Frontend (React)
```bash
cd frontend
npm start          # Development server (port 3000)
npm run build      # Production build
npm test           # Run tests (interactive watch mode)
```

### Backend API (Express)
```bash
cd backend
npm run dev        # Development with Nodemon (port 5000)
npm start          # Production mode
```

### AI Service
```bash
cd ai_service
npm run dev        # Development with Nodemon (port 5001)
npm start          # Production mode
```

## Architecture & Key Components

### Frontend Structure
- **State Management**: Redux Toolkit with feature slices:
  - `features/auth/` - Authentication state and user management
  - `features/characters/` - Character data and operations
  - `features/cart/` - Shopping cart functionality
  - `features/merchandise/` - Merchandise management
  - `features/alerts/` - Global alert/notification system

- **API Communication**: Centralized in `utils/api.js` with JWT token handling
- **Routing**: React Router v6 with protected routes via `ProtectedRoute` component

### Backend Structure
- **Authentication**: JWT-based with middleware in `middleware/auth.js`
- **Database Models** (Mongoose):
  - `User` - User accounts with auth
  - `Character` - Anime character profiles
  - `Chat` - Conversation history
  - `Merchandise` - Product listings
  - `Purchase` - Transaction records

- **External Integrations**:
  - **Stripe** (`services/stripe.js`) - Payment processing
  - **Printful** (`services/printful.js`) - Print-on-demand merchandise
  - **Shopify** (`services/shopify.js`) - E-commerce integration
  - **Cloudflare** (`services/cloudflare.js`) - Image hosting

### AI Service
- **OpenAI Integration**: Character personality responses
- **Endpoints**: `/chat` for AI-powered conversations
- **Models**: Character personality contexts

## Environment Configuration

Each service requires `.env` files with service-specific variables:
- Frontend: API endpoints
- Backend: Database URI, JWT secret, service API keys
- AI Service: OpenAI API key

## Current Development Priorities

From `todo.md`, top priorities include:
1. Stripe payment integration completion
2. Firebase authentication migration
3. Security implementations (captcha, rate limiting)
4. Merchandise marketplace with queue system for Printful API limits
5. Paywalling for image generation and conversation limits

## Important Notes

- No TypeScript - project uses plain JavaScript
- No test infrastructure currently implemented
- Frontend uses Create React App with built-in ESLint
- Backend and AI service lack linting configuration
- All services containerized with Docker for consistent development