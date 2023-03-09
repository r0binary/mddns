FROM node:18-alpine

ADD . /app

WORKDIR /app

RUN yarn install && yarn build

ENTRYPOINT yarn mddns
