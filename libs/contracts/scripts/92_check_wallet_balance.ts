module.exports = function (callback) {
  const config = require('./config/config');
  const Escrow = artifacts.require('Escrow');

  async function executeScript() {
    var EscrowInstance = await Escrow.at(config.escrowAddress);

    var account = process.argv[6];
    var deposit = process.argv[7];
    var amount = await EscrowInstance.escrowBalance(account, deposit);

    console.log(`Wallet ${account} and deposit ${deposit} has ${amount}`);
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
