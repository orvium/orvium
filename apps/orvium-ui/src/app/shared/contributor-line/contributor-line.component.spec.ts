import { TestBed } from '@angular/core/testing';

import { ContributorLineComponent } from './contributor-line.component';
import { MockRender } from 'ng-mocks';
import { RouterTestingModule } from '@angular/router/testing';
import { factoryUserSummaryDTO } from '../test-data';
import { By } from '@angular/platform-browser';

describe('OrvContributorLineComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContributorLineComponent, RouterTestingModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ContributorLineComponent, { user: factoryUserSummaryDTO.build() });
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should not contain link if the reviewer is anonymous', () => {
    const fixture = MockRender(ContributorLineComponent, {
      user: factoryUserSummaryDTO.build({ nickname: 'anonymous-reviewer' }),
    });
    const routerLink = fixture.debugElement.query(By.css('[aria-label="User info"] span'));
    const avatarImg = fixture.debugElement.query(By.css('[aria-label="User avatar"] > img'));
    expect(routerLink).toBeTruthy();
    expect(avatarImg).toBeTruthy();
  });

  it('should contain link if the reviewer is not anonymous', () => {
    const fixture = MockRender(ContributorLineComponent, { user: factoryUserSummaryDTO.build() });
    const routerLink = fixture.debugElement.query(By.css('[aria-label="User info"]  a'));
    const avatarImg = fixture.debugElement.query(By.css('[aria-label="User avatar"] > a'));
    expect(avatarImg).toBeTruthy();
    expect(routerLink).toBeTruthy();
  });
});
