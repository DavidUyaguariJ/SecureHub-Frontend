# Etapa 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar codigo fuente
COPY . .

# Pasar argumento de entorno
ARG BUILD_ENV=development
RUN npm run build -- --configuration=${BUILD_ENV}

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Copiar los archivos construidos
COPY --from=build /app/dist/securehub-frontend/browser /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
