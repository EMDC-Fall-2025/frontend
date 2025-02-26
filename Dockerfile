# Base image
FROM node:22-bullseye as base

WORKDIR /home/node/app

# Copy package files first to leverage Docker caching
COPY package*.json ./

#------------------------------------------------
# Development Stage (with nodemon)
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . .  
EXPOSE 5173
CMD ["npm", "run", "dev"]
#------------------------------------------------

# Production Stage
FROM base as production
ENV NODE_ENV production

# Copy all files before running the build
COPY . .

# Ensure TypeScript is installed globally if needed
RUN npm install -g typescript

RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npx tsc && \
  npm run build

# Ensure dist directory exists
RUN ls -la ./dist || mkdir ./dist

# Switch to non-root user
USER node

# Expose correct port
EXPOSE 5173

# Ensure correct startup file
CMD [ "node", "dist/index.js" ]
