FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json .
COPY server.js .
RUN mkdir -p /app/data

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
