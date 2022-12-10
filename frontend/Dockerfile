# BUILD
FROM node:16.17.0-bullseye-slim as build
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN yarn install --immutable --immutable-cache --check-cache
COPY . .
RUN npm run build

# RUN
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html