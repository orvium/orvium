/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  PublicationManagement,
  PublicationManagementInterface,
} from "../../contracts/PublicationManagement";

const _abi = [
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    name: "publications",
    outputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "previousVersion",
        type: "bytes32",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "review",
        type: "bytes32",
      },
    ],
    name: "addReview",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    name: "reviews",
    outputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "publication",
        type: "bytes32",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "fileIndex",
        type: "bytes32",
      },
      {
        name: "previousVersion",
        type: "bytes32",
      },
    ],
    name: "addPublication",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50610564806100206000396000f3fe608060405234801561001057600080fd5b5060043610610069576000357c01000000000000000000000000000000000000000000000000000000009004806345df7dae1461006e57806358160db7146100e35780638475100d14610111578063c182911014610186575b600080fd5b61009a6004803603602081101561008457600080fd5b81019080803590602001909291905050506101be565b604051808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019250505060405180910390f35b61010f600480360360208110156100f957600080fd5b8101908080359060200190929190505050610202565b005b61013d6004803603602081101561012757600080fd5b8101908080359060200190929190505050610354565b604051808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020018281526020019250505060405180910390f35b6101bc6004803603604081101561019c57600080fd5b810190808035906020019092919080359060200190929190505050610398565b005b60006020528060005260406000206000915090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060010154905082565b600073ffffffffffffffffffffffffffffffffffffffff166001600083815260200190815260200160002060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415156102bf576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602b8152602001806104ea602b913960400191505060405180910390fd5b60408051908101604052803373ffffffffffffffffffffffffffffffffffffffff168152602001828152506001600083815260200190815260200160002060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506020820151816001015590505050565b60016020528060005260406000206000915090508060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16908060010154905082565b600073ffffffffffffffffffffffffffffffffffffffff1660008084815260200190815260200160002060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141515610454576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260248152602001806105156024913960400191505060405180910390fd5b60408051908101604052803373ffffffffffffffffffffffffffffffffffffffff1681526020018281525060008084815260200190815260200160002060008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160010155905050505056fe5468697320706565722072657669657720686173206265656e20616c7265616479207075626c6973686564546869732066696c6520686173206265656e20616c7265616479207075626c6973686564a165627a7a72305820f4bcbae580ab7da8bc060d3abb2902f29e84119ee70372d135320448c0b817c00029";

type PublicationManagementConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: PublicationManagementConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class PublicationManagement__factory extends ContractFactory {
  constructor(...args: PublicationManagementConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<PublicationManagement> {
    return super.deploy(overrides || {}) as Promise<PublicationManagement>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): PublicationManagement {
    return super.attach(address) as PublicationManagement;
  }
  override connect(signer: Signer): PublicationManagement__factory {
    return super.connect(signer) as PublicationManagement__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PublicationManagementInterface {
    return new utils.Interface(_abi) as PublicationManagementInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): PublicationManagement {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as PublicationManagement;
  }
}