FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV REACT_APP_API_URL=http://backend:3000/api

EXPOSE 3001

CMD ["npm", "start"]
