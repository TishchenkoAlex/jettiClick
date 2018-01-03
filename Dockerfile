FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/package.json
RUN npm install

#build Angular app
COPY .angular-cli.json /usr/src/app/.angular-cli.json
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY src/ /usr/src/app/src
RUN node_modules/typescript/bin/tsc -p ./src/server/
RUN $(npm bin)/ng build --prod --aot=false

ENV PORT 8080
EXPOSE 8080

CMD [ "node", "./src/server/index.js" ]
# "typescript": "^2.7.0-dev.20180103"
