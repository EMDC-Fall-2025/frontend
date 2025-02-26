# Base image
FROM node:22-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

#------------------------------------------------
# Development Stage (with nodemon)
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . .  
# Expose port for frontend
EXPOSE 5173
# Ensure Vite binds to 0.0.0.0 (update vite.config.ts if needed)
CMD ["npm", "run", "dev"]
#------------------------------------------------

# Production Stage
FROM base as production
ENV NODE_ENV production

RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npm run build

# Copy build output and ensure ownership
COPY --chown=node:node ./dist/ ./dist/

# Switch to non-root user
USER node

# Expose correct port
EXPOSE 5173

# Ensure correct startup file
CMD [ "node", "dist/index.js" ]
