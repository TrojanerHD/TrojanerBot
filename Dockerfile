FROM node:lts-alpine as discord-bot

# create and set workdir
WORKDIR /usr/src/trojaner

# install dependencies 
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile
RUN yarn global add typescript

# copy bot to work dir
COPY . ./

RUN tsc

# main command
CMD ["node", "build/src/index.js"]