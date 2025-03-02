FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Make sure the port is properly exposed
EXPOSE 5000

# Use nodemon for better development experience
RUN npm install -g nodemon

# Add permissions to node_modules to avoid permission issues
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache

# Start with nodemon for auto-restart on changes
CMD ["nodemon", "--legacy-watch", "server.js"]