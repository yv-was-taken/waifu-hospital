# WaifuHospital AI Service

This microservice handles AI-powered character interactions for the WaifuHospital application.

## Features

- Character-specific AI chat responses
- OpenAI integration
- RESTful API endpoints

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Configure environment variables:

   - Create a `.env` file in the root directory
   - Add your OpenAI API key:

   ```
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Start the service:
   ```
   npm run dev  # For development with nodemon
   ```
   or
   ```
   npm start    # For production
   ```

## API Endpoints

### Health Check

```
GET /health
```

Returns the status of the service.

### Character Chat

```
POST /api/chat
```

Request body:

```json
{
  "message": "User's message here",
  "characterId": "1" // ID of the character to chat with
}
```

Response:

```json
{
  "response": "AI-generated character response"
}
```

## Development

The character context definitions can be expanded in the `getCharacterContext` function in `server.js`.

## Testing

Currently, the service redirects to static responses if OpenAI API calls fail, ensuring the application can function without the API key during development.
