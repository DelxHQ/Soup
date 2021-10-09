FROM ghcr.io/delxhq/node-gyp-images:latest

COPY . /app

WORKDIR /app

RUN yarn
RUN yarn build

RUN rm -rf src

CMD ["yarn", "start:prod"]
