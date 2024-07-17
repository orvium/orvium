import { TestBed } from '@angular/core/testing';

import { AppSnackBarService } from './app-snack-bar.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('AppSnackBarService', () => {
  let service: AppSnackBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, NoopAnimationsModule],
    });
    service = TestBed.inject(AppSnackBarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create info snackbar', () => {
    const spy = jest.spyOn(service.snackBar, 'open');
    service.info('Hello');
    expect(spy).toHaveBeenCalled();
  });

  it('should create warn snackbar', () => {
    const spy = jest.spyOn(service.snackBar, 'open');
    service.warning('Caution');
    expect(spy).toHaveBeenCalled();
  });

  it('should create error snackbar', () => {
    const spy = jest.spyOn(service.snackBar, 'open');
    service.error('Something went wrong');
    expect(spy).toHaveBeenCalled();
  });
});
