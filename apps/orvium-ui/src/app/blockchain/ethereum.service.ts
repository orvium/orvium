/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */
// noinspection JSUnusedGlobalSymbols

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, from, lastValueFrom, Observable } from 'rxjs';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { BlockchainService } from './blockchain.service';
import { TransactionResponse, Web3Provider } from '@ethersproject/providers';
import { ContractTransaction, Signer } from 'ethers';
import { AppSnackBarService } from '../services/app-snack-bar.service';
import { BlockchainNetworkDTO, DepositDTO, DepositPopulatedDTO } from '@orvium/api';
import { map, timeout } from 'rxjs/operators';
import { Escrow, OrviumToken, PublicationManagement } from '@orvium/contracts';
import { assertIsDefined } from '../shared/shared-functions';
import { keccak256 } from '@ethersproject/keccak256';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}
const tokenDecimals = '000000000000000000';

/**
 * Service for interacting with the Ethereum blockchain using MetaMask and ethers.js. This service is responsible
 * for initializing connections to the Ethereum network, managing Ethereum accounts, and handling smart contracts.
 * It is designed to work in browser environments where MetaMask is available.
 */
@Injectable({ providedIn: 'root' })
export class EthereumService {
  /** Reference to the publication management smart contract. This contract handles operations in the blockchain */
  public publicationManagementContract?: PublicationManagement;

  /** Reference to the escrow smart contract. This contract manages escrow transactions between parties */
  public escrowContract?: Escrow;

  /** Reference to the token smart contract. This contract manages operations related to the Orvium toke */
  public tokenContract?: OrviumToken;

  /** Current blockchain network configuration used by the service. This includes network-specific parameters */
  public networkConfig?: BlockchainNetworkDTO;

  /** Flag indicating if the Ethereum connection is initialized. */
  public isInitialized = false;

  /** BehaviorSubject tracking the current network configuration. */
  currentNetwork = new BehaviorSubject<BlockchainNetworkDTO | undefined>(undefined);

  /** The user's Ethereum account address. */
  public account?: string;

  /**  BehaviorSubject indicating whether the MetaMask is available. */
  public isAvailable = new BehaviorSubject<boolean>(false);

  /** Ethers.js Web3Provider for interacting with the Ethereum blockchain. */
  private provider?: Web3Provider;

  /** Ethers.js Signer for signing transactions. */
  private signer?: Signer;

  /** Flag to check if the platform is a browser, necessary for MetaMask interaction. */
  private isPlatformBrowser = false;

  /**
   * Constructs the EthereumService with necessary dependencies.
   *
   * @param {AppSnackBarService} snackBar - Service for displaying notifications.
   * @param {BlockchainService} blockchainService - Service for blockchain network configurations.
   * @param {Document} document - A reference to the DOM's Document object, injected to facilitate DOM manipulations.
   * @param {string} platformId - A token that indicates the platform ID.
   */
  constructor(
    private snackBar: AppSnackBarService,
    public blockchainService: BlockchainService,
    @Inject(DOCUMENT) public document: Document,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    this.isPlatformBrowser = isPlatformBrowser(this.platformId);
    if (this.isPlatformBrowser && this.document.defaultView) {
      const window = this.document.defaultView.window;
      if (window.ethereum?.isMetaMask) {
        this.isAvailable.next(true);
      }
    }
  }

  /**
   * Initializes the Ethereum connection by checking for MetaMask availability and requesting account access.
   * It sets up the Web3Provider and Signer and listens for network changes.
   *
   * @returns {Promise<boolean>} True if initialization is successful, false otherwise.
   */
  async init(): Promise<boolean> {
    this.isInitialized = false;
    const window = this.document.defaultView?.window;

    if (!this.isPlatformBrowser || !window) {
      console.log('This is only available in browser');
      return false;
    }

    if (!window.ethereum) {
      console.log('Ethereum not detected in this browser');
      return false;
    }

    // lazy load ethers js library
    const ethers = await import('ethers');
    const orviumContracts = await import('@orvium/contracts');

    // A Web3Provider wraps a standard Web3 provider, which is
    // what Metamask injects as window.ethereum into each page

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.provider = new ethers.providers.Web3Provider(window.ethereum);

    // MetaMask requires requesting permission to connect users accounts
    const promise = lastValueFrom(
      from(this.provider.send('eth_requestAccounts', [])).pipe(timeout(20000))
    );

    try {
      await promise;
    } catch (error) {
      console.warn(error);
      this.snackBar.error('Please check your Metamask extension');
      return false;
    }

    // The Metamask plugin also allows signing transactions to
    // send ether and pay to change state within the blockchain.
    // For this, you need the account signer...
    this.signer = this.provider.getSigner();
    this.account = await this.signer.getAddress();
    this.provider.on('networkChanged', (networkId: unknown) => {
      document.location.reload();
    });

    try {
      const network = await this.provider.getNetwork();
      this.networkConfig = this.blockchainService.getNetworkConfig(network.chainId);
      if (!this.networkConfig) {
        this.snackBar.error('Ethereum: This network is not supported, please select another one');
        return false;
      }
      this.currentNetwork.next(this.networkConfig);

      this.escrowContract = orviumContracts.Escrow__factory.connect(
        this.networkConfig.escrowAddress,
        this.signer
      );
      this.publicationManagementContract = orviumContracts.PublicationManagement__factory.connect(
        this.networkConfig.appAddress,
        this.signer
      );
      this.tokenContract = orviumContracts.OrviumToken__factory.connect(
        this.networkConfig.tokenAddress,
        this.signer
      );

      assertIsDefined(
        this.publicationManagementContract,
        'Config Error: Smart contracts not found'
      );
      assertIsDefined(this.escrowContract, 'Config Error: Smart contracts not found');
      assertIsDefined(this.tokenContract, 'Config Error: Smart contracts not found');
    } catch (error) {
      console.warn(error);
      this.snackBar.error('Ethereum: This network is not supported, please select another one');
      return false;
    }

    this.isInitialized = true;
    localStorage.setItem('metamask', 'true');

    return true;
  }

  /**
   * Closes the Ethereum service connection and clears any related local storage settings.
   */
  public close(): void {
    localStorage.setItem('metamask', 'false');
    this.isInitialized = false;
  }

  /**
   * Checks if the Ethereum service is ready by verifying initialization status and MetaMask's unlocked state.
   *
   * @returns {boolean} True if the service is initialized and the MetaMask wallet is unlocked, otherwise false.
   */
  public isReady(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.isInitialized && this.document.defaultView?.window.ethereum._metamask.isUnlocked();
  }

  /**
   * Retrieves the token balance for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit data transfer object containing the deposit ID.
   * @returns {Promise<string>} A promise that resolves to the token balance as a string.
   * @throws {Error} Throws an error if the Ethereum service is not ready or the necessary contracts are not found.
   */
  async getTokenBalance(deposit: DepositPopulatedDTO): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Ethereum service is not ready');
    }

    assertIsDefined(this.escrowContract, 'Escrow contract not found');
    assertIsDefined(this.signer, 'Signer not found');

    const tx = await this.escrowContract.balance(
      await this.signer.getAddress(),
      '0x' + deposit._id
    );
    return tx.toString();
  }

  /**
   * Deposits tokens into an escrow contract for a specific deposit.
   *
   * @param {string} value - The amount of tokens to deposit.
   * @param {DepositPopulatedDTO} deposit - The deposit data transfer object.
   * @returns {Observable<ContractTransaction>} An observable of the contract transaction.
   */
  async getTokenAllowance(): Promise<bigint> {
    assertIsDefined(this.tokenContract, 'Ethereum service not initialized correctly');
    assertIsDefined(this.signer, 'Ethereum service not initialized correctly');
    assertIsDefined(this.networkConfig, 'Ethereum service not initialized correctly');

    const allowance = await this.tokenContract.allowance(
      await this.signer.getAddress(),
      this.networkConfig.escrowAddress
    );

    return allowance.toBigInt();
  }

  /**
   * Deposits tokens into an escrow contract for a specific deposit.
   *
   * @param {string} value - The amount of tokens to deposit.
   * @param {DepositPopulatedDTO} deposit - The deposit data transfer object.
   * @returns {Observable<ContractTransaction>} An observable of the contract transaction.
   */
  depositTokens(value: string, deposit: DepositPopulatedDTO): Observable<ContractTransaction> {
    assertIsDefined(this.escrowContract, 'Config Error: Smart contracts not found');
    const orviumsEthFormat = value + tokenDecimals;
    return from(this.escrowContract.deposit('0x' + deposit._id, orviumsEthFormat));
  }

  /**
   * Approves tokens for deposit into an escrow.
   *
   * @param {string} value - The amount of tokens to approve.
   * @returns {Observable<ContractTransaction>} An observable of the contract transaction.
   */
  approveDepositTokens(value: string): Observable<ContractTransaction> {
    assertIsDefined(this.tokenContract, 'Ethereum service not initialized correctly');
    assertIsDefined(this.networkConfig, 'Ethereum service not initialized correctly');

    const orviumsEthFormat = value + tokenDecimals;

    return from(this.tokenContract.approve(this.networkConfig.escrowAddress, orviumsEthFormat));
  }

  /**
   * Pays a reviewer by transferring tokens from an escrow.
   *
   * @param {string} value - The amount of tokens to pay.
   * @param {DepositDTO} deposit - The deposit data transfer object.
   * @param {string} reviewerAddress - The Ethereum address of the reviewer.
   * @returns {Observable<TransactionResponse>} An observable of the transaction response.
   */
  payReviewer(
    value: string,
    deposit: DepositDTO,
    reviewerAddress: string
  ): Observable<TransactionResponse> {
    assertIsDefined(this.escrowContract, 'Ethereum service not initialized correctly');
    const orviumsEthFormat = value + tokenDecimals;

    return from(this.escrowContract.payment('0x' + deposit._id, reviewerAddress, orviumsEthFormat));
  }

  /**
   * Adds a publication proof of ownership to the blockchain.
   *
   * @param {string} keccak - The keccak hash of the publication.
   * @returns {Observable<TransactionResponse>} An observable of the transaction response.
   */
  publicationProofOwnership(keccak: string): Observable<TransactionResponse> {
    assertIsDefined(
      this.publicationManagementContract,
      'Ethereum service not initialized correctly'
    );
    return from(
      this.publicationManagementContract.addPublication('0x' + keccak, '0x' + keccak, {
        gasLimit: 750000,
      })
    );
  }

  /**
   * Retrieves the token balance for a user's wallet associated with a specific deposit.
   *
   * @param {string} wallet - The user's wallet address.
   * @param {DepositDTO | DepositPopulatedDTO} deposit - The deposit data transfer object.
   * @returns {Observable<bigint>} An observable that resolves to the token balance as a bigint.
   */
  getUserTokenBalance(
    wallet: string,
    deposit: DepositDTO | DepositPopulatedDTO
  ): Observable<bigint> {
    assertIsDefined(this.escrowContract, 'Ethereum service not initialized correctly');
    return from(this.escrowContract.balance(wallet, '0x' + deposit._id)).pipe(
      map(value => value.toBigInt())
    );
  }

  /**
   * Retrieves the token allowance for a user's wallet.
   *
   * @param {string} wallet - The user's wallet address.
   * @returns {Observable<bigint>} An observable that resolves to the token allowance as a bigint.
   */
  getUserTokenAllowance(wallet: string): Observable<bigint> {
    assertIsDefined(this.tokenContract, 'Ethereum service not initialized correctly');
    return from(this.tokenContract.balanceOf(wallet)).pipe(map(value => value.toBigInt()));
  }

  /**
   * Generates a keccak hash of the given file data.
   *
   * @param {ArrayBuffer} body - The file data as an ArrayBuffer.
   * @param {boolean} [hexPrefix=false] - Indicates whether to prefix the hash with '0x'.
   * @returns {string} The keccak hash of the file.
   */
  hashFile(body: ArrayBuffer, hexPrefix = false): string {
    let hash = keccak256(new Uint8Array(body));
    if (!hexPrefix) {
      hash = hash.substring(2);
    }
    return hash;
  }
}
