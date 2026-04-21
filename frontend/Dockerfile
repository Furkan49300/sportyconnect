# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
# Using a wildcard for yarn.lock to avoid errors if it doesn't exist yet
COPY package.json yarn.lock* ./
RUN yarn install

# Copy application code
COPY . .

# Build argument for the backend URL (can be passed via docker-compose)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Build the React app
RUN yarn build

# Production stage
FROM nginx:alpine
# Copy built static files
COPY --from=build /app/build /usr/share/nginx/html
# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
