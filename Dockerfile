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

# Install both production and dev dependencies to include TypeScript
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci  # Install all dependencies, including devDependencies

COPY . .  

# Ensure TypeScript is installed globally (optional but helpful)
RUN npm install -g typescript

# Run the TypeScript compiler and Vite build
RUN npx tsc -b && npm run build

#------------------------------------------------
# Production Stage
FROM node:22-bullseye as production
WORKDIR /home/node/app
ENV NODE_ENV production

# Copy only necessary production files from the build stage
COPY --from=build /home/node/app/dist ./dist  
COPY package*.json ./

# Install only production dependencies to keep the final image lightweight
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm ci --only=production

# Ensure the `dist` folder exists
RUN ls -la ./dist  

USER node
EXPOSE 5173
CMD ["node", "index.js"]
