FROM node:14.15.2

WORKDIR /app

COPY package* .
RUN npm ci

COPY . .

RUN npm run build

CMD [ "node", "server.js" ]
