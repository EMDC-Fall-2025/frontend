# Use node:22-bullseye as the base image
FROM node:22-bullseye as base

# Set the working directory inside the container
WORKDIR /home/node/app

# Copy package.json and package-lock.json (or yarn.lock) for npm install
COPY package*.json ./

# Install dependencies
RUN npm install

# Create a production stage
FROM base as production

# Set environment variable for production
ENV NODE_ENV production

# Cache npm packages to speed up future builds
RUN --mount=type=cache,target=/home/node/app/.npm \
  npm set cache /home/node/app/.npm && \
  npm ci --only=production && \
  npm run build

# Switch to non-root user
USER node

# Copy the build output (dist folder) to the container
# Ensure that the dist folder exists after build, or adjust the command to match your build output folder
COPY --chown=node:node ./dist/ ./dist/

# Expose the port for the application
EXPOSE 5173

# Start the application
CMD [ "node", "index.js" ]
