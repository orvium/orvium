import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Token', function () {
  it('Should mint token', async function () {
    const OrviumToken = await ethers.getContractFactory('OrviumToken');
    const orviumToken = await OrviumToken.deploy();
    await orviumToken.deployed();

    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy(orviumToken.address);
    await escrow.deployed();

    const [owner, addr1, addr2] = await ethers.getSigners();

    await orviumToken.mint(addr1.address, 200);
    expect(await orviumToken.balanceOf(addr1.address)).to.equal(200);
  });
});

//
// it("token should have correct name, symbol and decimals", async function () {
//     (await this.token.name.call()).should.equal("OrviumToken");
//     (await this.token.symbol.call()).should.equal("ORV");
//     let decimals = await this.token.decimals.call();
//     decimals.toString().should.equal("18");
// });
//
//
// it("should block transfers when token is paused", async function () {
//     await this.token.mint(contributor, utils.ether("3"));
//     await this.token.transfer(receiver, utils.ether("2"), { from: contributor }).should.be.rejectedWith(utils.EVMRevert);
//
//     await this.token.unpause();
//     await this.token.transfer(receiver, utils.ether("2"), { from: contributor }).should.be.fulfilled;
//
// });
//
// it("should mint group tokens", async function () {
//     const mintAddress1 = "0x0000000000000000000000000000000000012345";
//     const mintAddress2 = "0x0000000000000000000000000000000000012346";
//
//     // Block when beneficiaries and amounts do not math
//     beneficiaries = [mintAddress1, mintAddress2];
//     amounts = [utils.ether("1")];
//
//     await this.token.mintGroup(beneficiaries, amounts).should.be.rejectedWith(utils.EVMRevert);
//
//     beneficiaries = [mintAddress1, mintAddress2];
//     amounts = [utils.ether("1"),utils.ether("2")];
//
//     await this.token.mintGroup(beneficiaries, amounts).should.be.fulfilled;
//
// });
