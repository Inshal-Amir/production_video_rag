# Step 1: Build the React App
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve with Nginx (Production Server)
FROM nginx:alpine
# Copy the build output to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html
# Expose port 80 (Standard web port)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]