FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN chmod +x node_modules/.bin/vite
COPY . .
EXPOSE 3000
CMD ["node_modules/.bin/vite", "--host"]