# Build the code
FROM node:alpine as code-builder

ENV NODE_ENV=production

RUN apk add --no-cache \
    python3 \
    make \
    g++

COPY . /app
WORKDIR /app

RUN npm i -g typescript @tsconfig/node16

RUN npm ci
RUN npm run build

RUN rm -rf src node_modules


# Create slim prod image
FROM node:alpine

ENV NODE_ENV=production

COPY --from=builder /app /app
WORKDIR /app

CMD ["npm", "run", "start:prod"]
