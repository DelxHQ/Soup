FROM node:16.10-alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++

COPY . /app

WORKDIR /app

RUN yarn
RUN yarn build

RUN rm -rf src

CMD ["yarn", "start:prod"]
