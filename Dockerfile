# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY server/package*.json ./

# Instalar dependencias
RUN npm install --production

# Production stage
FROM node:22-alpine

# Metadatos
LABEL maintainer="UAP Analysis Team"
LABEL version="1.0"
LABEL description="UAP Analysis System - Testing Phase"

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copiar dependencias desde builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar aplicación
COPY server/ ./
COPY web-app/ ./web-app/

# Cambiar permisos
RUN chown -R nodejs:nodejs /app

# Cambiar al usuario nodejs
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando de inicio
CMD ["node", "app-memory.js"]
