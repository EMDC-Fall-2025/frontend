FROM node:22-bullseye as base
WORKDIR /home/node/app
COPY package*.json ./
COPY tsconfig.json ./

# Development Stage
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . . 
CMD ["npm", "run", "dev"]

# Build Stage
FROM base as build
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install && \
  npm run build

# Production Stage
FROM base as production
ENV NODE_ENV production
USER node
COPY --from=build --chown=node:node /home/node/app/dist ./dist
EXPOSE 5173
CMD ["node", "index.js"]
