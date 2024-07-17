import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { TableOfContentsComponent } from './table-of-contents.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockRender } from 'ng-mocks';

describe('TableOfContentsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableOfContentsComponent, RouterTestingModule],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(TableOfContentsComponent);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should reset headers', () => {
    const fixture = MockRender(TableOfContentsComponent);
    const component = fixture.point.componentInstance;
    component.resetHeaders();
    expect(component._linkSections).toBeTruthy();
    expect(component._links).toBeTruthy();
  });

  it('should not add headers', fakeAsync(() => {
    const fixture1 = MockRender(TableOfContentsComponent);
    const component = fixture1.point.componentInstance;
    const fixture = MockRender('<h1>Title</h1><h3>Subtitle</h3><div>1</div>');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    component.addHeaders('anchor', fixture.point.nativeElement);
    tick(500);
    fixture.detectChanges();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    fixture.point.nativeElement.dispatchEvent(new Event('scroll'));

    component.onScroll();
  }));
});
