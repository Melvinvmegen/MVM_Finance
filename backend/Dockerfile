# --------------> The build image
FROM node:16.17.0-bullseye-slim as build
EXPOSE 3000
WORKDIR /usr/src/app
COPY . .
ENV NODE_ENV=production
RUN npm install
RUN npm prune --production

ENTRYPOINT [ "node", "server.js" ]