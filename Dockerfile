FROM node:alpine

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

COPY . .

CMD [ "yarn", "start" ]
