# --------------> The build image
FROM node:16.17.0-bullseye-slim as build

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN yarn install --immutable --immutable-cache --check-cache

COPY . /app

RUN yarn run build

# --------------> The production image
FROM node:16.17.0-bullseye-slim

ENV NODE_ENV=production

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["dumb-init", "node", "dist/app.js"]