FROM node:22-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY --from=builder /app/dist/ dist/
COPY bin/ bin/
COPY proto/ proto/

EXPOSE 3737

# Default: run the HTTP API server
CMD ["node", "dist/index.js", "serve", "--port", "3737", "--host", "0.0.0.0"]
