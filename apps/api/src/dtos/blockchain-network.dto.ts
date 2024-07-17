import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BlockchainNetworkDTO {
  /**
   * Blockchain codename
   * @example mainnet
   */
  @Expose() name!: string;

  /**
   * Blockchain display name
   * @example "Ethereum Mainnet"
   */
  @Expose() displayName!: string;

  /** Blockchain Network ID
   * @example 1
   */
  @Expose() networkId!: number;

  /** SmartContract address of the application
   * @example 0x6DBA6e75Ae8a7c342144380f0A5FbFc2Eee8D8ab
   */
  @Expose() appAddress!: string;

  /** SmartContract address of the escrow
   * @example 0xd1eBDEF716CE17Cc24A6B207b4dA49729f74202a
   */
  @Expose() escrowAddress!: string;

  /** SmartContract address of the token
   * @example 0x470562a0DAb25092310eC8F58503aF053A54250E
   */
  @Expose() tokenAddress!: string;

  /**
   * URL of the blockchain explorer.
   * @example https://etherscan.io/
   */
  @Expose() explorerUrl!: string;
}
