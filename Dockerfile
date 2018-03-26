FROM node

# Create app directory
RUN mkdir -p /usr/jetti
WORKDIR /usr/jetti

# Install app dependencies
COPY package.json ./package.json
RUN npm i

#patch mssql driver
COPY patches/mssql/lib/ node_modules/mssql/lib/
#COPY patches/mssql/lib/base.js node_modules/mssql/lib/base.js
#COPY patches/mssql/lib/tedious.js node_modules/mssql/lib/tedious.js
#COPY patches/mssql/lib/msnodesqlv8.js node_modules/mssql/lib/msnodesqlv8.js

#build Angular app
COPY .angular-cli.json ./.angular-cli.json
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY src/ ./src
COPY server/ ./server
RUN node_modules/typescript/bin/tsc -p ./server
RUN $(npm bin)/ng build --prod

ENV PORT 8080
EXPOSE 8080

CMD [ "node", "./server/index.js" ]
