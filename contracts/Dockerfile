FROM node:18-alpine

WORKDIR /app

RUN npm install -g truffle

COPY package*.json ./
RUN npm install

COPY . .

RUN truffle compile --force

CMD ["sh", "-c", "truffle migrate --network development && tail -f /dev/null"]
