import { MockProvider, MockRender } from 'ng-mocks';
import { BlockchainService } from '../blockchain.service';
import BlockchainInfoComponent from './blockchain-info.component';
import { TestBed } from '@angular/core/testing';

describe('BlockchainInfoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockchainInfoComponent],
      providers: [
        MockProvider(BlockchainService, {
          networks: [],
        }),
      ],
    }).compileComponents();
  });
  it('should create', () => {
    const fixture = MockRender(BlockchainInfoComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
