FROM node:alpine

COPY . /app

WORKDIR /app

ENV NODE_ENV=production

RUN npm i

CMD ["npm", "run", "start:prod"]
