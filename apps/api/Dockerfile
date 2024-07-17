FROM docker-base:1.1.1

## Install application agent
RUN mkdir app
WORKDIR ./app
COPY ./package*.json ./
COPY .npmrc .npmrc
RUN npm ci

## Now copy the source code
COPY src tsconfig* nest* ./
RUN npm run prebuild && npm run build

ENTRYPOINT ["npm", "run", "start:agent"]
