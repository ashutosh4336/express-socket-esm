FROM --platform=arm64 node:20

# Create app directory
WORKDIR /usr/src/app

RUN npm install pm2 -g

# Install app dependencies
COPY package*.json ./

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm install --omit=dev

# Bundle app source
COPY . ./

EXPOSE 80

CMD [ "npm",  "start" ]
