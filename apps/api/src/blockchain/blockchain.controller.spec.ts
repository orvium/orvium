import { BlockchainService } from './blockchain.service';
import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let service: BlockchainService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [BlockchainController],
      imports: [MongooseTestingModule.forRoot('BlockchainController')],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(BlockchainController);
    service = module.get(BlockchainService);

    // Empty the collection before each test
    await service.blockchainNetworkModel.deleteMany({});
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should get blockchain configurations', async () => {
    await service.create({
      name: 'ropsten',
      displayName: 'Ropsten',
      networkId: 3,
      appAddress: '0x992419b34A8ec785E07842804878d6d799f8Eaac',
      escrowAddress: '0x0C1FAB9103564258F7173f5849BcB433Cf5513B2',
      tokenAddress: '0x45B89a627AF99DcCdF25a03F6f4986F55e9EB491',
      explorerUrl: 'https://ropsten.etherscan.io/tx/',
    });
    const blockchainNetworkDTOS = await controller.getBlockchainNetworks();
    expect(blockchainNetworkDTOS.length).toBe(1);
    expect(blockchainNetworkDTOS[0].name).toBe('ropsten');
  });
});
