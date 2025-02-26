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
# Build Stage
FROM node:22-bullseye as build
WORKDIR /home/node/app
COPY package*.json ./

# Install dependencies, including TypeScript
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npm install -g typescript # <-- Ensure TypeScript is installed

COPY . .  
RUN npm run build

#------------------------------------------------
# Production Stage
FROM node:22-bullseye as production
WORKDIR /home/node/app
ENV NODE_ENV production

# Copy built `dist` from the build stage
COPY --from=build /home/node/app/dist ./dist  

# Install production dependencies (if needed)
RUN npm ci --only=production

# Use Vite to serve the built project
USER node
EXPOSE 4173  
CMD ["npm", "run", "preview"]
