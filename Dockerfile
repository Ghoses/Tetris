# Use a modern Node.js runtime as a parent image
FROM node:20-alpine

# Install build tools like Python needed for some native Node modules (e.g., better-sqlite3)
RUN apk add --no-cache python3 build-base
ENV PYTHON=/usr/bin/python3

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production if a build script exists
RUN npm run build --if-present

# Make port 38126 available
EXPOSE 38126

# Run the app using the start script
CMD ["npm", "start"]

# Use a single, straightforward Node.js environment
FROM node:20-alpine

# Define build arguments
ARG VITE_GOOGLE_API_KEY
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

# Install build tools, just in case
RUN apk add --no-cache python3 build-base
ENV PYTHON=/usr/bin/python3

# Set the working directory
WORKDIR /app

# Copy all source files
COPY . .

# Install all dependencies
RUN npm install

# Run the build process
RUN npm run build

# Expose the port the server listens on
EXPOSE 3000

# Run the server directly using tsx
CMD ["npx", "tsx", "server.ts"]
