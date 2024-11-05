# Step 1: Build the React app
FROM node:16 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build the production-ready static files
RUN npm run build

# Step 2: Serve the app with Nginx
# FROM nginx:stable-alpine
# COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
# EXPOSE 80
EXPOSE 8080

ENTRYPOINT npx react-inject-env set && nginx -g daemon off;



