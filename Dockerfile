FROM node:16.10-alpine3.11

RUN apk add --no-cache \
    build-base \
    g++ \
    python3 \
    ffmpeg \
    libtool \
    autoconf \
    automake

COPY . /app

WORKDIR /app

RUN yarn
RUN yarn build

RUN rm -rf src

CMD ["yarn", "start:prod"]
