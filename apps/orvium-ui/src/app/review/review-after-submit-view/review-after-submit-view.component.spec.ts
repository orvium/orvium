import { ReviewAfterSubmitViewComponent } from './review-after-submit-view.component';
import { Router } from '@angular/router';
import { MockRender } from 'ng-mocks';
import { factoryDepositDTO, factoryReviewPopulatedDTO } from '../../shared/test-data';
import { ReviewStatus } from '@orvium/api';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ReviewAfterSubmitViewComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewAfterSubmitViewComponent, RouterTestingModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewAfterSubmitViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should search by discipline', () => {
    const fixture = MockRender(ReviewAfterSubmitViewComponent);
    const router = fixture.point.injector.get(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation();
    const discipline = 'biology';
    fixture.point.componentInstance.searchByDiscipline(discipline);
    expect(navigateSpy).toHaveBeenCalledWith(['/search'], {
      queryParams: { discipline: discipline, size: 10 },
      queryParamsHandling: 'merge',
    });
  });

  it('should init component', () => {
    const fixture = MockRender(ReviewAfterSubmitViewComponent);
    fixture.point.componentInstance.review = {
      ...factoryReviewPopulatedDTO.build(),
      status: ReviewStatus.PendingApproval,
      depositPopulated: factoryDepositDTO.build({
        authors: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'email@email.com',
            credit: [],
            institutions: [],
          },
        ],
      }),
    };
    fixture.point.componentInstance.ngOnInit();
    expect(fixture.point.componentInstance.depositAuthor).toBe('John Doe');
  });
});
