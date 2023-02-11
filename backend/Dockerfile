# --------------> The build image
FROM node:16.17.0-bullseye-slim as build

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN yarn install --immutable --immutable-cache --check-cache
COPY . /app

RUN npx prisma generate
RUN yarn run build

COPY migrate-and-start.sh .
RUN chmod +x migrate-and-start.sh

# --------------> The production image
FROM node:16.17.0-bullseye-slim

ENV NODE_ENV=production

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/migrate-and-start.sh ./

EXPOSE 8080

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./migrate-and-start.sh"]