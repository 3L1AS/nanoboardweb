# Build stage for React frontend and TypeScript backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and install all workspace dependencies
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install Docker CLI so the Node app can run docker commands
# Use isolated docker client install to keep image small
RUN apk add --no-cache docker-cli

# Copy built files and dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 8080

# Run the server
WORKDIR /app/server
CMD ["node", "dist/index.js"]
