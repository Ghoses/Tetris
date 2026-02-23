# Stage 1: Build the application
FROM node:20-alpine AS build

# Define build arguments
ARG VITE_GOOGLE_API_KEY
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

# Set the working directory
WORKDIR /app

# Clear npm cache and set registry
RUN npm cache clean --force && npm config set registry https://registry.npmjs.org/

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline --no-audit

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the app with a simple, production-ready static server
FROM node:20-alpine

WORKDIR /app

# Clear npm cache
RUN npm cache clean --force && npm config set registry https://registry.npmjs.org/

# Copy the package.json to install 'serve'
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .

# Install 'serve'
RUN npm install --legacy-peer-deps --prefer-offline --no-audit --omit=dev

# Copy the built static files
COPY --from=build /app/dist ./dist

# Expose the port 'serve' will listen on
EXPOSE 3000

# Start the server
ENTRYPOINT []
CMD [ "npx", "serve", "-s", "dist", "-l", "3000" ]
CMD [ "npx", "serve", "-s", "dist", "-l", "3000" ]
