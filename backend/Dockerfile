# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the application with ts-node in transpile-only mode
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"] 