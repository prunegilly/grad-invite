FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /data

ENV PORT=3000
ENV DB_PATH=/data/data.db

EXPOSE 3000

CMD ["node", "server.js"]
