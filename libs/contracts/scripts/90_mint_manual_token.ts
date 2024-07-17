module.exports = function (callback) {
  const config = require('./config/config');
  const OrviumToken = artifacts.require('OrviumToken');

  async function executeScript() {
    // Instantiate token by token contract address
    var TokenInstance = await OrviumToken.at(config.tokenAddress);

    var account = process.argv[6];
    var amount = web3.utils.toBN(process.argv[7]);

    console.log(typeof account);
    console.log(typeof amount);

    console.log(`Mint account ${account} with balance ${amount}`);

    var result = await TokenInstance.mint(account, amount, {
      from: config.ownerAddress,
      gas: config.methodGas,
    });

    console.log(result);
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
