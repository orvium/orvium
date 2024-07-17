import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositInvitationListComponent } from './deposit-invitation-list.component';

describe('DepositInvitationListComponent', () => {
  let component: DepositInvitationListComponent;
  let fixture: ComponentFixture<DepositInvitationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepositInvitationListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DepositInvitationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
