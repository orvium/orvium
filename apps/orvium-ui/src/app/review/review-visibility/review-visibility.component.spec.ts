import { TestBed } from '@angular/core/testing';
import { ReviewVisibility, ReviewVisibilityComponent } from './review-visibility.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { DialogService } from '../../dialogs/dialog.service';
import { TemplateRef } from '@angular/core';
import { factoryReviewPopulatedDTO } from '../../shared/test-data';

describe('ReviewVisibilityComponent', () => {
  let template: TemplateRef<unknown>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReviewVisibilityComponent],
      providers: [
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ReviewVisibilityComponent, {
      visibilities: factoryReviewPopulatedDTO.build(),
    });
    expect(fixture).toBeTruthy();
  });

  it('should open dialog when clicking the icon button', () => {
    const fixture = MockRender(ReviewVisibilityComponent, {
      visibilities: factoryReviewPopulatedDTO.build(),
    });
    fixture.point.componentInstance.openVisibilityDialog(template);
  });

  it('should set correctly the icons', () => {
    const fixture = MockRender(ReviewVisibilityComponent, {
      visibilities: factoryReviewPopulatedDTO.build(),
    });
    const component = fixture.point.componentInstance;

    let visibility: ReviewVisibility = {
      showIdentityToAuthor: true,
      showIdentityToEveryone: true,
      showReviewToAuthor: true,
      showReviewToEveryone: true,
    };
    component.setIcons(visibility);
    expect(component.identityIcon).toBe('lock_open_right');
    expect(component.reviewIcon).toBe('visibility');

    visibility = {
      showIdentityToAuthor: true,
      showIdentityToEveryone: false,
      showReviewToAuthor: true,
      showReviewToEveryone: false,
    };
    component.setIcons(visibility);
    expect(component.identityIcon).toBe('lock_person');
    expect(component.reviewIcon).toBe('visibility_lock');

    visibility = {
      showIdentityToAuthor: false,
      showIdentityToEveryone: false,
      showReviewToAuthor: false,
      showReviewToEveryone: false,
    };
    component.setIcons(visibility);
    expect(component.identityIcon).toBe('lock');
    expect(component.reviewIcon).toBe('visibility_off');
  });
});
