FROM node:16.10-alpine3.11

COPY . /app

WORKDIR /app

ARG NODE_ENV=production

RUN yarn
RUN yarn build

RUN rm -rf src

CMD ["yarn", "start:prod"]
