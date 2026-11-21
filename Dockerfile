# Stage 1: Build React
FROM node:24-alpine AS frontend-build
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Run Express
FROM node:24-alpine AS production
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend-build /build/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
EXPOSE 5001

USER node
CMD ["npm", "start"]