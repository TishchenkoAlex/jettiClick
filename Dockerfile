FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/package.json
COPY .angular-cli.json /usr/src/app/.angular-cli.json
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY src/ /usr/src/app/src

RUN yarn
RUN node_modules/typescript/bin/tsc -p ./src/server/
RUN $(npm bin)/ng build --prod --aot=false

#RUN cp dist/ /usr/src/app/dist
#COPY src/server/ /usr/src/app/

ENV PORT 8080
EXPOSE 8080

CMD [ "node", "./src/server/index.js" ]

#docker build --rm -f Dockerfile -t jetti-fs-mat:latest .
#docker tag jetti-fs-mat jetti.azurecr.io/jetti-fs-mat
#docker push jetti.azurecr.io/jetti-fs-mat