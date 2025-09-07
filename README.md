# Running the application:

## 1. Without Docker

1. npm install
2. npm run dev

## 2. With Docker

1. Start docker engine
2. Cd into development-environment folder
3. Run docker-compose build (if you haven't built the containers before)
4. Run docker-compose up -d / docker compose --env-file .env.docker up -d --build web django-api db
5. Navigate to localhost:7001 to see your changes
6. To close docker run: docker compose --env-file .env.docker down. 

# Project Overview:

## Tools:

- React
- Vite
- Material UI
- Zustand

## Structure:

- **frontend**: Project root

- **frontend/src**: Houses all components

- **frontend/src/assets**: Houses all images or logos

- **frontend/src/components**: Houses all components that are not pages themselves such as navbar or tables
- **frontend/src/pages**: Houses files for each page of the application

- **frontend/src/store**: Houses all store files for state manager to call api endpoints

- **frontend/src/App.tsx**: Calls main component

- **frontend/src/main.tsx**: Houses routes for each page

- **frontend/src/theme.tsx**: Houses Material UI theme with app colors and typography options
