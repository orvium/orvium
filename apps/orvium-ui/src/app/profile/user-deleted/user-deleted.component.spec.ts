import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDeletedComponent } from './user-deleted.component';
import { MockProvider } from 'ng-mocks';
import { ActivatedRoute } from '@angular/router';

describe('UserDeletedComponent', () => {
  let component: UserDeletedComponent;
  let fixture: ComponentFixture<UserDeletedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDeletedComponent],
      providers: [MockProvider(ActivatedRoute)],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDeletedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
