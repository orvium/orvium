'use strict';
const serverlessExpress = require('@codegenie/serverless-express');
const server = require('../../dist/orvium-ui/server/main');
exports.handler = serverlessExpress({ app: server.app() });
