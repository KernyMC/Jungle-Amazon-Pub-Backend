# ============================================
# Dockerfile para Backend - NestJS
# ============================================

# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . ./

# Construir la aplicación NestJS
RUN npm run build

# ============================================
# Etapa 2: Producción
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar solo las dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar el código compilado desde builder
COPY --from=builder /app/dist ./dist

# Cambiar al usuario no-root
USER nestjs

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto del backend
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"]
