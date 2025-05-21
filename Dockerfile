FROM node:22-alpine

WORKDIR /app

# # PRODUCTION

# COPY package*.json ./

# RUN npm install --production

# COPY . .

# RUN npm run build

# EXPOSE 3001

# CMD ["npm", "run", "start:prod"]


# Development

COPY package*.json ./

RUN npm install

COPY . .

ENV CHOKIDAR_USEPOLLING=true

RUN npm install --save-dev @nestjs/cli

EXPOSE 3001

CMD ["npm", "run", "start:dev"]