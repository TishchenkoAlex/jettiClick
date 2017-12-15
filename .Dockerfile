FROM node:latest

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package-docker.json /usr/src/app/package.json
RUN yarn

# Bundle app source
COPY dist/ /usr/src/app/dist
COPY src/server/ /usr/src/app/

ENV PORT 4200
EXPOSE 4200



CMD [ "node", "index.js" ]
