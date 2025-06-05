# Use official Node.js runtime as base image
FROM node:18-alpine

# Install Python and build tools for native dependencies
# ADD krb5-dev to fix kerberos build
RUN apk add --no-cache python3 make g++ krb5-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"]
