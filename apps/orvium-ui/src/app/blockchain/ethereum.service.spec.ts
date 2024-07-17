/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MockBuilder, MockRender } from 'ng-mocks';
import { EthereumService } from './ethereum.service';
import { PLATFORM_ID } from '@angular/core';
import { lastValueFrom, of } from 'rxjs';
import { ethers } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { factoryDepositDTO, factoryDepositPopulatedDTO } from '../shared/test-data';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web3 = require('@depay/web3-mock');

describe('EthereumService', () => {
  const blockchain = 'ethereum';
  const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'];
  beforeAll(() => {
    web3.mock({ blockchain, accounts: { return: accounts }, wallet: 'metamask' });
    global.window.ethereum._metamask = { isUnlocked: jest.fn().mockReturnValue(true) };
  });

  beforeEach(() => {
    return MockBuilder(EthereumService)
      .mock(BlockchainService)
      .provide({ provide: PLATFORM_ID, useValue: 'browser' });
  });

  it('should be created', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(service).toBeDefined();
  });

  it('should init', async () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    const blockchainService = fixture.point.componentInstance.blockchainService;
    jest.spyOn(ethers.providers.Web3Provider.prototype, 'getNetwork').mockReturnValue(
      // @ts-expect-error
      lastValueFrom(
        of({
          chainId: 1,
        })
      )
    );
    jest.spyOn(blockchainService, 'getNetworkConfig').mockReturnValue({
      name: 'ropsten',
      networkId: 3,
      displayName: 'Ropsten',
      tokenAddress: '0x45B89a627AF99DcCdF25a03F6f4986F55e9EB491',
      escrowAddress: '0x0C1FAB9103564258F7173f5849BcB433Cf5513B2',
      appAddress: '0x992419b34A8ec785E07842804878d6d799f8Eaac',
      explorerUrl: 'https://ropsten.etherscan.io/',
    });

    const result = await service.init();
    expect(result).toBe(true);
    expect(service.isReady()).toBe(true);
  });

  it('should hash file', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    const encoder = new TextEncoder();
    const hashedText = service.hashFile(encoder.encode('This is my text to hash'));
    expect(hashedText).toEqual('bdae32bc107f8274b4981093e0b8104173d24bef0331051559981f3a1c0d3410');

    const hashedTextWith0x = service.hashFile(encoder.encode('This is my text to hash'), true);
    expect(hashedTextWith0x).toEqual(
      '0xbdae32bc107f8274b4981093e0b8104173d24bef0331051559981f3a1c0d3410'
    );
  });
});

describe('EthereumService Without Ethereum', () => {
  const blockchain = 'ethereum';
  const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'];
  beforeAll(() => {
    web3.mock({ blockchain, accounts: { return: accounts }, wallet: 'metamask' });
    global.window.ethereum._metamask = { isUnlocked: jest.fn().mockReturnValue(true) };
  });

  beforeEach(() => MockBuilder(EthereumService).mock(PLATFORM_ID, 'browser'));

  it('should be created', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(service).toBeDefined();
  });

  it('should not init if ethereum is not available', async () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    const result = await service.init();
    expect(result).toBe(false);
  });

  it('should fail executing getTokenBalance', async () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    await expect(service.getTokenBalance(factoryDepositPopulatedDTO.build())).rejects.toThrow(
      new Error('Ethereum service is not ready')
    );
  });

  it('should fail executing getTokenAllowance', async () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    await expect(service.getTokenAllowance()).rejects.toThrow(
      new Error('Ethereum service not initialized correctly')
    );
  });

  it('should fail executing depositTokens', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(() => service.depositTokens('100', factoryDepositPopulatedDTO.build())).toThrow(
      new Error('Config Error: Smart contracts not found')
    );
  });

  it('should fail executing approveDepositTokens', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(() => service.approveDepositTokens('100')).toThrow(
      new Error('Ethereum service not initialized correctly')
    );
  });

  it('should fail executing payReviewer', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(() => service.payReviewer('100', factoryDepositDTO.build(), 'asdfasdf')).toThrow(
      new Error('Ethereum service not initialized correctly')
    );
  });

  it('should fail executing publicationProofOwnership', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(() => service.publicationProofOwnership('asdfasdfasdfasdf')).toThrow(
      new Error('Ethereum service not initialized correctly')
    );
  });

  it('should fail executing getUserTokenBalance', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(() =>
      service.getUserTokenBalance('asdfasdfasdfasdf', factoryDepositPopulatedDTO.build())
    ).toThrow(new Error('Ethereum service not initialized correctly'));
  });

  it('should fail executing getUserTokenAllowance', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(() => service.getUserTokenAllowance('asdfasdfasdfasdf')).toThrow(
      new Error('Ethereum service not initialized correctly')
    );
  });
});

describe('EthereumService SSR', () => {
  const blockchain = 'ethereum';
  const accounts = ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045'];
  beforeAll(() => {
    web3.mock({ blockchain, accounts: { return: accounts }, wallet: 'metamask' });
    global.window.ethereum._metamask = { isUnlocked: jest.fn().mockReturnValue(true) };
  });

  beforeEach(() => MockBuilder(EthereumService).mock(PLATFORM_ID, 'server'));

  it('should be created', () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    expect(service).toBeDefined();
  });

  it('should not init in SSR', async () => {
    const fixture = MockRender(EthereumService);
    const service = fixture.point.componentInstance;
    const result = await service.init();
    expect(result).toBe(false);
    expect(service.isReady()).toBe(false);
  });
});
