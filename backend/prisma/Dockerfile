FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json ./package.json
COPY schema.prisma prisma/schema.prisma
COPY migrations prisma/migrations
RUN npm install
ENV NODE_ENV=production
ENTRYPOINT [ "npx", "prisma", "migrate", "deploy" ]