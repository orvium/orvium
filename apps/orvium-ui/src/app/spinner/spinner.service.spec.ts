import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { SpinnerService } from './spinner.service';

describe('SpinnerService', () => {
  let service: SpinnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [],
      providers: [Overlay],
    });
    service = TestBed.inject(SpinnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show', () => {
    service.show();
    expect(service).toBeDefined();
  });

  it('should hide', () => {
    service.hide();
    expect(service).toBeDefined();
  });
});
