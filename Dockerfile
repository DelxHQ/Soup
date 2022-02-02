FROM node:alpine

COPY . /app

WORKDIR /app

ENV NODE_ENV=production

RUN npm install --only=production

CMD ["npm", "run", "start:prod"]
