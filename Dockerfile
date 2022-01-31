FROM node:alpine

RUN apk add --no-cache \
    python3 \
    make \
    g++

COPY . /app

WORKDIR /app

RUN npm i
RUN npm run build

RUN rm -rf src

CMD ["npm", "run", "start:prod"]
