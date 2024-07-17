import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentSectionDemoComponent } from './comment-section-demo.component';
import { ActivatedRoute } from '@angular/router';
import { MockProvider } from 'ng-mocks';

describe('CommentSectionDemoComponent', () => {
  let component: CommentSectionDemoComponent;
  let fixture: ComponentFixture<CommentSectionDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentSectionDemoComponent],
      providers: [MockProvider(ActivatedRoute)],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentSectionDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
