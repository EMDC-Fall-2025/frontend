# Base stage
FROM node:22-bullseye as base
WORKDIR /home/node/app
COPY package*.json ./

#------------------------------------------------
# Development stage
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . .
# Ensure nodemon watches the right files
CMD ["npm", "run", "dev"]
#------------------------------------------------

# Production stage
FROM base as production
ENV NODE_ENV production

# Install dependencies and build the project
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npm run build  # <-- Ensures "dist" is created before copying

# Ensure the dist directory exists before copying
RUN ls -la /home/node/app/dist || mkdir -p /home/node/app/dist  

# Switch to a non-root user
USER node
# Copy built files
COPY --chown=node:node --from=production /home/node/app/dist ./dist  

# Expose the required port
EXPOSE 5173

# Start the application
CMD ["node", "index.js"]
