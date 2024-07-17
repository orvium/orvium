module.exports = function (callback) {
  const config = require('./config/config');
  const OrviumToken = artifacts.require('OrviumToken');

  async function executeScript() {
    // Instantiate token by token contract address
    var TokenInstance = await OrviumToken.at(config.tokenAddress);

    var account = process.argv[6];
    var amount = await TokenInstance.balanceOf.call(account);

    console.log(`Wallet ${account} has ${amount}`);
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
