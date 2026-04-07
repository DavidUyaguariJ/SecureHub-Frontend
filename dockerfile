# -------- BUILD --------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG BUILD_ENV=production
RUN npm run build -- --configuration=$BUILD_ENV

# -------- SERVE --------
FROM nginx:alpine

COPY --from=build /app/dist/SecureHub-Frontend/browser /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
