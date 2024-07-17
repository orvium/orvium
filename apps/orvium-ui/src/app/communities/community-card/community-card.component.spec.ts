import { CommunityCardComponent } from './community-card.component';
import { MockRender } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { factoryCommunityDTO } from '../../shared/test-data';

describe('CommunityCardComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [CommunityCardComponent],
    })
  );

  it('should create', () => {
    const fixture = MockRender(CommunityCardComponent, { community: factoryCommunityDTO.build() });
    expect(fixture).toBeDefined();
  });
});
