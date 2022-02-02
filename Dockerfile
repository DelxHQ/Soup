# Build the code
FROM node:alpine as code-builder

RUN apk add --no-cache \
    python3 \
    make \
    g++

COPY . /app
WORKDIR /app

RUN npm ci
RUN npm run build

RUN rm -rf src node_modules


# Install prod deps (some are addons so g++ is required)
FROM node:alpine as prod-deps

RUN apk add --no-cache \
    python3 \
    make \
    g++

ENV NODE_ENV=production

COPY --from=builder /app /app
WORKDIR /app

RUN npm ci


# Create slim prod image
FROM node:alpine

ENV NODE_ENV=production

COPY --from=prod-deps /app /app
WORKDIR /app

CMD ["npm", "run", "start:prod"]
