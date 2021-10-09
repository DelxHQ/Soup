FROM node:16.10-alpine

COPY . /app

WORKDIR /app

RUN yarn
RUN yarn build

RUN rm -rf src

CMD ["yarn", "start:prod"]
