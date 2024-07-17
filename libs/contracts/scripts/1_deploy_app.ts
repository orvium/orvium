module.exports = function (callback) {
  var PublicationManagement = artifacts.require('PublicationManagement');

  async function executeScript() {
    var result = await PublicationManagement.new();
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
