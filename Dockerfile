# Stage 1: Build the application
FROM node:20 AS build

# Define build arguments
ARG VITE_GOOGLE_API_KEY
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies (with build tools available)
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Run the Node.js server
FROM node:20

WORKDIR /app

# Copy package.json for reference
COPY --from=build /app/package*.json ./

# Copy already-built node_modules with all native binaries compiled
COPY --from=build /app/node_modules ./node_modules

# Copy the built frontend
COPY --from=build /app/dist ./dist

# Copy the server file  
COPY --from=build /app/server.ts .

# Expose the port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run the server
CMD [ "node", "server.ts" ]
