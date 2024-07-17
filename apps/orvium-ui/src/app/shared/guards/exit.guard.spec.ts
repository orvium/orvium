import { TestBed } from '@angular/core/testing';
import { ExitGuard, OnExit } from './exit.guard';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, RouterStateSnapshot } from '@angular/router';

class MockComponent implements OnExit {
  onExit(): boolean | Observable<boolean> {
    return of(true);
  }
}

describe('ExitGuard', () => {
  let guard: ExitGuard;
  let mockComponent: MockComponent;
  let route: ActivatedRoute;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExitGuard,
        MockComponent,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: {} },
        },
      ],
    });
    guard = TestBed.inject(ExitGuard);
    mockComponent = TestBed.inject(MockComponent);
    route = TestBed.inject(ActivatedRoute);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('can route if unguarded', () => {
    expect(
      guard.canDeactivate(mockComponent, route.snapshot, [
        'toString',
      ] as unknown as RouterStateSnapshot)
    ).toBeTruthy();
  });
});
