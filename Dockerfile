FROM node:alpine

COPY . /app

WORKDIR /app

ENV NODE_ENV=production

RUN npm i

RUN ls
RUN pwd

CMD ["npm", "run", "start:prod"]
