# Etapa 1: Build
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG BUILD_ENV=development
RUN npm run build -- --configuration=${BUILD_ENV}

# DEBUG
RUN ls -la /app/dist/

# Etapa 2: Nginx
FROM nginx:alpine

COPY --from=build /app/dist/SecureHub-Frontend /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
