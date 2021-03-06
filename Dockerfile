FROM node:8-slim

MAINTAINER reposibot@repositive.io

ENV NODE_ENV docker

WORKDIR /opt

COPY . ./

EXPOSE 3000

CMD npm start
