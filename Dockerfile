FROM node:22-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

FROM base as production
ENV NODE_ENV production
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npm run build
USER node
COPY --chown=node:node ./dist/ .
EXPOSE 5173
CMD [ "node", "index.js" ]