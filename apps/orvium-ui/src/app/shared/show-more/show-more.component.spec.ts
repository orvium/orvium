import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ShowMoreComponent } from './show-more.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ShowMoreComponent', () => {
  let component: ShowMoreComponent;
  let fixture: ComponentFixture<ShowMoreComponent>;

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      imports: [ShowMoreComponent, NoopAnimationsModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowMoreComponent);
    component = fixture.componentInstance;
    component.truncateLength = 2;
    component.text = 'Sample text here!';
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should show buttons', () => {
    component.text = 'Sample text here!';
    component.ngOnInit();
    expect(component.showButtons).toBe(true);
  });

  it('should show less', () => {
    component.expanded = true;
    component.text = 'Test text';
    component.readMore();
    expect(component.expanded).toBe(false);
  });

  it('should show more', () => {
    component.expanded = false;
    component.text = 'Test text';
    component.readMore();
    expect(component.expanded).toBe(true);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display text', () => {
    component.text = 'Sample text here!';
    component.expanded = true;
    component.ngOnInit();
    expect(component.showButtons).toBe(true);
  });
});
