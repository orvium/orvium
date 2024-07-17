module.exports = function (callback) {
  var tokenAddress = '0x470562a0DAb25092310eC8F58503aF053A54250E';
  var Escrow = artifacts.require('Escrow');

  async function executeScript() {
    var result = await Escrow.new(tokenAddress);
    var receipt = await web3.eth.getTransactionReceipt(result.transactionHash);

    console.log('\n\n');
    console.log(result);
    console.log('\n\n');
    console.log(receipt);
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
