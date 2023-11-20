FROM node:20.4-bullseye-slim
COPY package.json package.json
COPY index.js index.js
COPY src src
COPY utils utils
RUN yarn install
ENTRYPOINT node index.js