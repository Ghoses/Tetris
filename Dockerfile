# Stage 1: Build the application
FROM node:20-alpine AS build

# Define build arguments
ARG VITE_GOOGLE_API_KEY
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the app with a simple, production-ready static server
FROM node:20-alpine

WORKDIR /app

# Copy the package.json to install 'serve'
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .

# Install 'serve'
RUN npm ci --omit=dev --legacy-peer-deps

# Copy the built static files
COPY --from=build /app/dist ./dist

# Expose the port 'serve' will listen on
EXPOSE 3000

# Start the server
ENTRYPOINT []
CMD [ "npx", "serve", "-s", "dist", "-l", "3000" ]
