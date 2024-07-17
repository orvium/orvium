import { DescriptionLineComponent } from './description-line.component';
import { MockRender } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('DescriptionLineComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DescriptionLineComponent, RouterTestingModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DescriptionLineComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
