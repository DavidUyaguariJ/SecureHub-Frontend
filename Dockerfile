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

# Mostrar la estructura de directorios para debug
RUN ls -la /app/dist/

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# Copiar los archivos construidos - copiar todo el contenido de dist
COPY --from=build /app/dist/SecureHub-Frontend /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
