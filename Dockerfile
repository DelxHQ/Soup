FROM node:alpine

COPY . /app

WORKDIR /app

ENV NODE_ENV=production

CMD ["npm", "run", "start:prod"]
