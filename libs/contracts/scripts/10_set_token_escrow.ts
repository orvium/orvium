module.exports = function (callback) {
  const config = require('./config/config');
  const Escrow = artifacts.require('Escrow');

  async function executeScript() {
    var EscrowInstance = await Escrow.at(config.escrowAddress);
    console.log(EscrowInstance);

    var tokenAddress = process.argv[6];
    console.log(tokenAddress);
    var amount = await EscrowInstance.setToken(tokenAddress);

    console.log(`Set token ${tokenAddress} to escrow ${EscrowInstance.address}`);
  }

  executeScript()
    .then(r => {
      return callback();
    })
    .catch(e => {
      console.log(e);
      return callback();
    });
};
