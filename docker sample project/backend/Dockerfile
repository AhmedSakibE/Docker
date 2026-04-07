
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev

FROM node:22-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY server.js .
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:3000/api/name || exit 1
CMD ["node", "server.js"]
