FROM node:10.15.3-alpine

WORKDIR /app
VOLUME /app/posts

RUN apk add --no-cache git

COPY index.js /app/index.js
COPY package.json /app/package.json
COPY lib /app/lib
COPY static /app/static
COPY views /app/views

RUN npm i

EXPOSE 1440
CMD ["node", "index.js"]
