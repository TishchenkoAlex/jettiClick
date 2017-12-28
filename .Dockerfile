FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package-docker.json /usr/src/app/package.json
RUN yarn

# Bundle app source
COPY dist/ /usr/src/app/dist
COPY src/server/ /usr/src/app/

ENV PORT 8080
EXPOSE 8080

CMD [ "node", "index.js" ]

#docker build --rm -f Dockerfile -t jetti-fs-mat:latest .
#docker tag jetti-fs-mat jetti.azurecr.io/jetti-fs-mat
#docker push jetti.azurecr.io/jetti-fs-mat