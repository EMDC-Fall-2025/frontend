# Base Stage
FROM node:22-bullseye as base
WORKDIR /home/node/app
COPY package*.json ./

#------------------------------------------------
# Development Stage
FROM node:22-bullseye as dev
WORKDIR /home/node/app
COPY package*.json ./

RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install

COPY . .  
CMD ["npm", "run", "dev"]

#------------------------------------------------
# Build Stage (Separate from Final Production)
FROM node:22-bullseye as build
WORKDIR /home/node/app
COPY package*.json ./

RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production

COPY . .  
RUN npm run build  # Ensure build runs successfully

#------------------------------------------------
# Production Stage
FROM node:22-bullseye as production
WORKDIR /home/node/app
ENV NODE_ENV production

# Copy built `dist` from the build stage instead of the local context
COPY --from=build /home/node/app/dist ./dist  

# Ensure the dist folder exists
RUN ls -la ./dist  

USER node
EXPOSE 5173
CMD ["node", "index.js"]
