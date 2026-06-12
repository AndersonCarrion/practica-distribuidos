# Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# 1. Declaramos los ARGs que vienen del docker-compose.yml
ARG MAQUINA1_IP
ARG MAQUINA2_IP
ARG MAQUINA3_IP

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .

# 2. Generamos dinámicamente el .env.production antes de compilar
# Nota: Como el WORKDIR es /app y ya copiaste el contenido de frontend/, 
# el archivo .env.production se crea directamente en la raíz de la app de Vite.
RUN echo "VITE_API_SERVERS=http://${MAQUINA1_IP}:80/api,http://${MAQUINA2_IP}:80/api,http://${MAQUINA3_IP}:80/api" > .env.production

# 3. Al ejecutar el build, Vite detectará el archivo recién creado y congelará las IPs correctas
RUN npm run build

# Nginx (Esta etapa se mantiene igual)
FROM nginx:alpine
RUN apk add --no-cache gettext
COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]