# Base stage
FROM node:22-bullseye as base
WORKDIR /home/node/app
COPY package*.json ./
COPY tsconfig.json ./ 
COPY tsconfig.app.json ./ 
COPY tsconfig.node.json ./ 
COPY src ./src  
COPY vite.config.ts ./ 
COPY index.html ./

# Dev stage
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . .
CMD ["npm", "run", "dev"]

# Builder stage (for production build)
FROM base as builder
ENV NODE_ENV production
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --include=dev && \ 
  npm run build

# Production stage
FROM base as production
ENV NODE_ENV production
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production 

# Copy built files from the builder stage
COPY --from=builder --chown=node:node /home/node/app/dist ./dist

# Set user and expose port
USER node
EXPOSE 5173
CMD ["node", "dist/app/index.js"] 