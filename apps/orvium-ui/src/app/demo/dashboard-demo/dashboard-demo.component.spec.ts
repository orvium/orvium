import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDemoComponent } from './dashboard-demo.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('DemoDashboardComponent', () => {
  let component: DashboardDemoComponent;
  let fixture: ComponentFixture<DashboardDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardDemoComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
