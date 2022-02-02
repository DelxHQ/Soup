FROM node:alpine

COPY . /app

WORKDIR /app

RUN npm i

CMD ["npm", "run", "start:prod"]
