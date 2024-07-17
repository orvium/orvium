#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

mongoimport --uri $MONGO_URI --collection disciplines --type json --jsonArray --file ./disciplines.json
mongoimport --uri $MONGO_URI --collection domains --type json --jsonArray --file ./domains.json
mongoimport --uri $MONGO_URI --collection network --type json --jsonArray --file ./network.json
mongoimport --uri $MONGO_URI --collection configuration --type json --jsonArray --file ./configuration.json
