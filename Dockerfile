# Define the base stage explicitly
FROM node:22-bullseye as base
WORKDIR /home/node/app
COPY package*.json ./

#------------------------------------------------
# Development stage
FROM node:22-bullseye as dev
WORKDIR /home/node/app
COPY package*.json ./

RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . .
CMD ["npm", "run", "dev"]
#------------------------------------------------

# Production stage
FROM node:22-bullseye as production
WORKDIR /home/node/app
ENV NODE_ENV production
COPY package*.json ./

RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npm run build

# Ensure dist exists
RUN ls -la /home/node/app/dist || mkdir -p /home/node/app/dist  

USER node
COPY --chown=node:node ./dist/ .
EXPOSE 5173
CMD ["node", "index.js"]
