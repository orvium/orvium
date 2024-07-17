const Escrow = require('../build/contracts/Escrow');
const PublicationManagement = require('../build/contracts/PublicationManagement');
const OrviumToken = require('../build/contracts/OrviumToken');

const fs = require('fs');

fs.writeFileSync(
  '../build/deploy/Escrow.json',
  JSON.stringify({ abi: Escrow['abi'], bytecode: Escrow['bytecode'] }, null, 2),
  'utf8'
);
fs.writeFileSync(
  '../build/deploy/PublicationManagement.json',
  JSON.stringify(
    { abi: PublicationManagement['abi'], bytecode: PublicationManagement['bytecode'] },
    null,
    2
  ),
  'utf8'
);
fs.writeFileSync(
  '../build/deploy/OrviumToken.json',
  JSON.stringify({ abi: OrviumToken['abi'], bytecode: OrviumToken['bytecode'] }, null, 2),
  'utf8'
);
