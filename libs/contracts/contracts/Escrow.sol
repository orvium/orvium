pragma solidity ^0.5.4;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Escrow is Ownable {

    event Deposit(address indexed author, bytes12 indexed depositId, uint amount);
    event Payment(address indexed author, bytes12 indexed depositId, address indexed reviewer, uint amount);

    ERC20 public token;
    mapping(address => mapping(bytes12 => uint256)) private _balance;


    constructor (ERC20 _token) public {
        token = _token;
    }

    function setToken(ERC20 _token) onlyOwner public {
        token = _token;
    }

    function deposit(bytes12 depositId, uint256 amount) public {
        require(token.transferFrom(msg.sender, address(this), amount), "Not enough ORV tokens for this operation");
        _balance[msg.sender][depositId] += amount;

        emit Deposit(msg.sender, depositId, amount);
    }

    function payment(bytes12 depositId, address reviewer, uint256 paymentAmount) public {
        uint256 currentAmount = _balance[msg.sender][depositId];
        require(currentAmount >= paymentAmount, "Not enough ORV tokens in deposit for this operation");
        _balance[msg.sender][depositId] = currentAmount - paymentAmount;
        require(token.transfer(reviewer, paymentAmount), "Problem transferring payment tokens");

        emit Payment(msg.sender, depositId, reviewer, paymentAmount);
    }

    function balance(address author, bytes12 depositId) public view returns (uint256) {
        return _balance[author][depositId];
    }

}
