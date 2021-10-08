FROM node:16.10-alpine3.11

RUN apk add --no-cache \
    python3

COPY . /app

WORKDIR /app

RUN yarn
RUN yarn build

RUN rm -rf src
RUN rm -rf node_modules

ARG NODE_ENV=production

RUN yarn

CMD ["yarn", "start:prod"]
