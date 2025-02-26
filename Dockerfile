FROM node:22-bullseye as base
WORKDIR /home/node/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY src/ ./src/
COPY vite.config.ts ./

# Development Stage
FROM base as dev
RUN npm install
COPY . . 
CMD ["npm", "run", "dev"]

# Build Stage
FROM base as build
RUN npm install && npm run build

# Production Stage
FROM nginx:alpine as production
COPY --from=build /home/node/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
