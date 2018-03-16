FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/package.json
RUN npm i

#patch mssql driver
COPY tedious.js node_modules/mssql/lib/tedious.js

#build Angular app
COPY .angular-cli.json /usr/src/app/.angular-cli.json
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY src/ /usr/src/app/src
RUN node_modules/typescript/bin/tsc -p ./src/server/
RUN $(npm bin)/ng build --prod

ENV PORT 8080
EXPOSE 8080

CMD [ "node", "./src/server/index.js" ]
