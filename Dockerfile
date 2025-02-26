# Base Stage
FROM node:22-bullseye as base
WORKDIR /home/node/app
COPY package*.json ./ 
COPY tsconfig*.json ./ 
COPY vite.config.ts ./ 

# Copy everything except node_modules (handled separately)
COPY src/ ./src/ 
COPY public/ ./public/ 

# Development Stage
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
CMD ["npm", "run", "dev"]

# Build Stage
FROM base as build
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install && \
  npm run build

# Production Stage
FROM node:22-bullseye as production
WORKDIR /home/node/app
ENV NODE_ENV=production
USER node

# Copy built assets
COPY --from=build --chown=node:node /home/node/app/dist ./dist
COPY --from=build --chown=node:node /home/node/app/public ./public

# Install a minimal server
RUN npm install -g serve

EXPOSE 5173
CMD ["serve", "-s", "dist"]
