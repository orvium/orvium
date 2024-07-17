import { OnboardingComponent } from './onboarding.component';
import { MockBuilder, MockInstance, MockRender, MockReset } from 'ng-mocks';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { ProfileService } from '../profile.service';
import { DefaultService, UserPrivateDTO } from '@orvium/api';
import { factoryUserPrivateDTO } from '../../shared/test-data';

describe('OnboardingComponent', () => {
  afterEach(MockReset);

  beforeEach(() => {
    MockInstance(DefaultService, 'isDomainBlocked', jest.fn().mockReturnValue(of({})));
    MockInstance(
      ProfileService,
      'profile',
      new BehaviorSubject<UserPrivateDTO | undefined>(factoryUserPrivateDTO.build())
    );
    MockInstance(ProfileService, 'getProfileFromApi', () => of(factoryUserPrivateDTO.build()));
    return MockBuilder(OnboardingComponent).provide(FormBuilder);
  });

  it('should create', () => {
    const fixture = MockRender(OnboardingComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should sendConfirmationEmail', () => {
    const fixture = MockRender(OnboardingComponent);
    const apiService = TestBed.inject(DefaultService);
    // @ts-expect-error
    const spy = jest.spyOn(apiService, 'sendConfirmationEmail').mockReturnValue(of({}));
    fixture.point.componentInstance.sendConfirmationEmail();
    expect(spy).toHaveBeenCalled();
  });

  it('should refresh', () => {
    const fixture = MockRender(OnboardingComponent);
    const profileService = TestBed.inject(ProfileService);
    const spy = jest
      .spyOn(profileService, 'getProfileFromApi')
      .mockReturnValue(of(factoryUserPrivateDTO.build()));
    fixture.point.componentInstance.refresh();
    expect(spy).toHaveBeenCalled();
  });

  it('should save', () => {
    const fixture = MockRender(OnboardingComponent);
    const profileService = TestBed.inject(ProfileService);
    const spy = jest
      .spyOn(profileService, 'updateProfile')
      .mockReturnValue(of(factoryUserPrivateDTO.build()));
    fixture.point.componentInstance.save();
    expect(spy).toHaveBeenCalled();
  });

  it('should save 2', () => {
    const fixture = MockRender(OnboardingComponent);
    const profileService = TestBed.inject(ProfileService);
    const spy = jest.spyOn(profileService, 'updateProfile').mockReturnValue(of());
    fixture.point.componentInstance.save();
    expect(spy).toHaveBeenCalled();
  });

  it('should fail confirm email', () => {
    const fixture = MockRender(OnboardingComponent);
    const profileService = TestBed.inject(ProfileService);
    const spy = jest
      .spyOn(profileService, 'confirmEmail')
      .mockReturnValue(of({ success: false, message: '' }));
    fixture.point.componentInstance.confirmEmail();
    expect(spy).toHaveBeenCalled();
  });

  it('should confirm email', () => {
    const fixture = MockRender(OnboardingComponent);
    const profileService = TestBed.inject(ProfileService);
    const spy = jest
      .spyOn(profileService, 'confirmEmail')
      .mockReturnValue(of({ success: true, message: '' }));
    fixture.point.componentInstance.confirmEmail();
    expect(spy).toHaveBeenCalled();
  });

  it('should complete onboarding', () => {
    const fixture = MockRender(OnboardingComponent);
    const profileService = TestBed.inject(ProfileService);
    const spy = jest
      .spyOn(profileService, 'updateProfile')
      .mockReturnValue(of(factoryUserPrivateDTO.build()));
    fixture.point.componentInstance.completeOnboarding();
    expect(spy).toHaveBeenCalled();
  });

  it('get domain validation correctly', () => {
    const fixture = MockRender(OnboardingComponent);
    const apiService = TestBed.inject(DefaultService);
    const result = fixture.point.componentInstance.validateDomain({
      value: 'example@example.com',
    } as AbstractControl);
    expect(apiService.isDomainBlocked).toHaveBeenCalled();
    result.subscribe(value => {
      expect(value).toBeNull();
    });
  });

  it('get domain validation correctly with number instace of string', () => {
    const fixture = MockRender(OnboardingComponent);
    const apiService = TestBed.inject(DefaultService);
    const result = fixture.point.componentInstance.validateDomain({
      value: 15,
    } as AbstractControl);
    expect(apiService.isDomainBlocked).toHaveBeenCalled();
    result.subscribe(value => {
      expect(value).toBeNull();
    });
  });

  it('get error in domain validation', () => {
    const getDomain = MockInstance(
      DefaultService,
      'isDomainBlocked',
      jest.fn().mockReturnValue(of(true))
    );
    const fixture = MockRender(OnboardingComponent);
    const result = fixture.point.componentInstance.validateDomain({
      value: 'example@example.com',
    } as AbstractControl);
    expect(getDomain).toHaveBeenCalled();
    result.subscribe(value => {
      expect(value).toEqual({ invalidDomain: 'The domain "orvium.io" is not a valid domain' });
    });
  });
});
