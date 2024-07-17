import { MockRender } from 'ng-mocks';
import { OverlayLoadingDirective } from './overlay-loading.directive';
import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';

describe('OverlayLoadingDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [OverlayLoadingDirective],
      providers: [Overlay],
    })
  );

  it('should render overlay', () => {
    const fixture = MockRender('<button [appOverlayLoading]="isFetchingData"></button>', {
      isFetchingData: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fixture.nativeElement.innerHTML).not.toContain('cdk-overlay-backdrop');
    fixture.componentInstance.isFetchingData = true;
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(fixture.nativeElement.innerHTML).toContain('cdk-overlay-backdrop');
  });
});
