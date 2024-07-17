pragma solidity ^0.5.4;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

/**
 * @title OrviumToken
 * @dev Orvium token
 */
contract OrviumToken is ERC20Mintable {

    string public name = "OrviumToken";
    string public symbol = "ORV";
    uint8 public decimals = 18;

    // Set cap based on bonus
    uint256 cap = 378333333 * 1 ether;

    constructor () public {
    }

}
