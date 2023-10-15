FROM node:20.4-bullseye-slim
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
EXPOSE 3000
WORKDIR /usr/src/app
COPY . .
ENV NODE_ENV=production
RUN npm install
RUN npm prune --production
# HEALTHCHECK CMD curl --fail-early --silent http://localhost:3000/health 2>&1 | grep '"status":"UP"' || exit 1
ENTRYPOINT [ "node", "server.js" ]