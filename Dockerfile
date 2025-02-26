FROM node:22-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

#------------------------------------------------
# Separate dev stage with nodemon and different CMD
FROM base as dev
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm install
COPY . .
EXPOSE 5173
# "npm run dev" corresponds to "nodemon src/index.js"
CMD ["npm", "run", "dev"]
#------------------------------------------------