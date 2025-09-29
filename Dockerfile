# -------- Stage 1: Build Angular --------
FROM node:20.19.0 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# -------- Stage 2: Nginx --------
FROM nginx:1.25-alpine

RUN rm -rf /usr/share/nginx/html/*

# 👇 Copiamos desde /browser
COPY --from=builder /app/dist/citizen-feedback/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
