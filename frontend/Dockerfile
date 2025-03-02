FROM node:16

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY . .

# Fix permissions issues
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Expose port
EXPOSE 3000

# Start development server with explicit binding to all interfaces
ENV DISABLE_ESLINT_PLUGIN=true
ENV HOST=0.0.0.0
ENV WDS_SOCKET_HOST=0.0.0.0
ENV WDS_SOCKET_PORT=3000
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true
CMD ["npm", "start"]