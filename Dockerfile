# Use official Node.js LTS image
FROM node:22-bullseye as base

WORKDIR /home/node/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Build application (if applicable)
RUN npm run build

# Set non-root user
USER node

# Expose necessary port
EXPOSE 5173

# Start the application
CMD ["node", "dist/index.js"]
