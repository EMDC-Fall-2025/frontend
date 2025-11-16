FROM node:18 AS base

# Set working directory
WORKDIR /home/node/app/

FROM base AS dev 
RUN --mount=type=cache,target=/home/node/.npm \
    npm set cache /home/node/.npm 

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set environment variables
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Expose the port the app runs on
EXPOSE 5173

# Start the application in development mode
CMD ["npm", "run", "dev"]
