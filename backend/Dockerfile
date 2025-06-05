# Use official Node.js runtime as base image
FROM node:18-alpine AS base

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

# Production target - default behavior
FROM base AS production
# Start the application with ts-node in transpile-only mode
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]

# Seed target - for running database seeding
FROM base AS seed
# Command to run seed script
CMD ["npx", "ts-node", "--project", "tsconfig.json", "scripts/seed.ts"]

# Seed content target - for running content seeding
FROM base AS seed-content
# Command to run seed content script
CMD ["npx", "ts-node", "--project", "tsconfig.json", "scripts/seed-content.ts"]

# Migrate target - for running database migration
FROM base AS migrate
# Command to run migration script
CMD ["npx", "ts-node", "--project", "tsconfig.json", "scripts/migrate-to-mongoose.ts"]

# Scripts target - for running any script passed as argument
FROM base AS scripts
# This will be overridden by docker run command
CMD ["npx", "ts-node", "--project", "tsconfig.json"] 