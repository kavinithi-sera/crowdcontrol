# Dockerfile for the Next.js frontend
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "npm start -- -p ${PORT:-8080}"]
