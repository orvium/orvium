import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityCalendarComponent } from './community-calendar.component';
import { CalendarDTO } from '@orvium/api';

describe('CalendarComponent', () => {
  let component: CommunityCalendarComponent;
  let fixture: ComponentFixture<CommunityCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommunityCalendarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create with time', () => {
    component.calendarEvents = [{} as CalendarDTO];
    component.ngOnInit();
    expect(component).toBeDefined();
  });
});
