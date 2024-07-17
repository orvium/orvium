import { Injectable } from '@angular/core';
import { BlockchainNetworkDTO, DefaultService } from '@orvium/api';

/**
 * Service to manage blockchain network configurations and interactions within the application. It fetches and stores
 * blockchain network data, and provides access to specific network details. The service uses an API service to retrieve
 * network data and stores it locally for quick access.
 */
@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  /** Stores the array of blockchain networks fetched from the API. */
  networks: BlockchainNetworkDTO[] = [];

  /**
   * Constructs the BlockchainService with dependency injection.
   *
   * @param {DefaultService} apiService - The API service used to fetch blockchain networks.
   */
  constructor(private apiService: DefaultService) {}

  /**
   * Initializes the list of blockchain networks by fetching them from the API and storing them locally.
   */
  initNetworks(): void {
    this.apiService.getBlockchainNetworks().subscribe(networks => (this.networks = networks));
  }

  /**
   * Retrieves a blockchain network by its name.
   *
   * @param {string} networkName - The name of the blockchain network to retrieve.
   * @returns {BlockchainNetworkDTO | undefined} The network data object if found, otherwise undefined.
   */
  getNetworkByName(networkName: string): BlockchainNetworkDTO | undefined {
    for (const network of this.networks) {
      if (network.name === networkName) {
        return network;
      }
    }
    return undefined;
  }

  /**
   * Retrieves a blockchain network configuration by its network ID.
   *
   * @param {number} networkId - The ID of the blockchain network to retrieve.
   * @returns {BlockchainNetworkDTO | undefined} The network configuration if found, otherwise undefined.
   */
  getNetworkConfig(networkId: number): BlockchainNetworkDTO | undefined {
    for (const network of this.networks) {
      if (network.networkId === networkId) {
        return network;
      }
    }
    return undefined;
  }
}
