import { EmptyStatePublicationsComponent } from './empty-state-publications.component';
import { MockRender } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('EmptyStatePublicationsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmptyStatePublicationsComponent, RouterTestingModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(EmptyStatePublicationsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
