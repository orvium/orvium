import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InviteDialogComponent } from './invite-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BehaviorSubject, of } from 'rxjs';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { ProfileService } from '../../profile/profile.service';
import { DefaultService, UserPrivateDTO } from '@orvium/api';
import { factoryUserPrivateDTO } from '../../shared/test-data';
import { DialogService } from '../dialog.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

// Noop component is only a workaround to trigger change detection
@Component({
  template: '',
})
class NoopComponent {}

const TEST_DIRECTIVES = [NoopComponent];

@NgModule({
  imports: [
    MatDialogModule,
    NoopAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatChipsModule,
    MatInputModule,
    MatIconModule,
    ClipboardModule,
    FontAwesomeModule,
    MatSnackBarModule,
  ],
  exports: TEST_DIRECTIVES,
  declarations: TEST_DIRECTIVES,
})
class DialogTestModule {}

describe('InviteComponent', () => {
  let fixture: ComponentFixture<InviteDialogComponent>;
  let component: InviteDialogComponent;
  let profileBehaviour: BehaviorSubject<UserPrivateDTO | undefined>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DialogTestModule,
        MatDialogModule,
        HttpClientModule,
        RouterTestingModule.withRoutes([]),
        FormsModule,
        ReactiveFormsModule,
        FontAwesomeTestingModule,
        ClipboardModule,
      ],
      providers: [{ provide: DialogService, useValue: { closeAll: jest.fn() } }],
    }).compileComponents();

    const profile = factoryUserPrivateDTO.build();
    profileBehaviour = new BehaviorSubject<UserPrivateDTO | undefined>(profile);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteDialogComponent);
    component = fixture.componentInstance;
    const profileService = fixture.debugElement.injector.get(ProfileService);
    profileService.profile = profileBehaviour;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should onNoClick', () => {
    const dialogService = fixture.debugElement.injector.get(DialogService);
    const spy = jest.spyOn(dialogService, 'closeAll').mockReturnValue();
    component.onNoClick();
    expect(spy).toHaveBeenCalled();
  });

  it('should send invites', () => {
    const apiService = fixture.debugElement.injector.get(DefaultService);
    // @ts-expect-error
    jest.spyOn(apiService, 'sendInvitations').mockReturnValue(of({}));
    fixture.detectChanges();
    component.sendEmailFormGroup.controls.emails.setValue(['test@example.com']);
    component.send();
    expect(component.sendEmailFormGroup.controls.emails.value.length).toBe(1);
  });
});
