import { ThemeService } from './theme.service';
import { MockedComponentFixture, MockRender } from 'ng-mocks';

describe('ThemeService', () => {
  let fixture: MockedComponentFixture<ThemeService, ThemeService>;
  let service: ThemeService;

  beforeEach(() => {
    fixture = MockRender(ThemeService);
    service = fixture.point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
