import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListWrapperComponent } from './list-wrapper.component';

describe('ListWrapperComponent', () => {
  let component: ListWrapperComponent;
  let fixture: ComponentFixture<ListWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
