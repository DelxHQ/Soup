FROM node:16.10-alpine3.11
COPY . /app
WORKDIR /app
RUN yarn
RUN yarn build
RUN rm -rf src

FROM node:16.10-alpine3.11
WORKDIR /app
COPY package.json ./
ARG NODE_ENV=production
RUN yarn
##COPY --from=0 /app/dist .
CMD ["yarn","start:prod"]
