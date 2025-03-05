# WaifuHospital

WaifuHospital is an interactive web application featuring anime-styled medical characters in a hospital setting. Users can create, browse, and interact with various "waifu" characters through AI-powered chat, as well as purchase character-related merchandise.

## Project Structure

The application is built as a microservices architecture with three main components:

- **Frontend**: React-based user interface
- **Backend**: Express/Node.js API with MongoDB database
- **AI Service**: Separate service for AI-powered character interactions

## Features

- User authentication and profiles
- Character creation and customization
- AI-powered chat with anime medical characters
- Character browsing and social interactions
- Merchandise store with payment processing
- Responsive design for desktop and mobile

## Technologies

### Frontend

- React
- Redux for state management
- React Router for navigation
- Styled-components for styling

### Backend

- Node.js and Express
- MongoDB with Mongoose
- JWT authentication
- RESTful API architecture

### AI Service

- OpenAI integration for character responses
- Express-based microservice

### Others

- Stripe payment integration
- Docker for containerization

## Getting Started

1. Clone the repository
2. Install dependencies in each directory:
   ```
   cd frontend && npm install
   cd backend && npm install
   cd ai_service && npm install
   ```
3. Set up environment variables (see .env.example files)
4. Start the services:
   ```
   docker-compose up
   ```

## Development

To run the services individually for development:

```
# Backend API
cd backend && npm run dev

# Frontend
cd frontend && npm start

# AI Service
cd ai_service && npm run dev
```

## License

[MIT License](LICENSE)
