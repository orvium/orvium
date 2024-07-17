import { TestBed } from '@angular/core/testing';
import { DepositsService } from './deposits.service';
import {
  factoryCommunityDTO,
  factoryDepositPopulatedDTO,
  factoryUserPrivateDTO,
} from '../shared/test-data';
import { CommunityDTO, UserPrivateDTO } from '@orvium/api';

describe('DepositsService', () => {
  let service: DepositsService;
  let profile: UserPrivateDTO;
  let community: CommunityDTO;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepositsService);

    profile = factoryUserPrivateDTO.build();
    community = factoryCommunityDTO.build();
  });

  it('user should not be able to update deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = [];
    expect(service.canUpdateDeposit(deposit)).toBe(false);
  });

  it('user should not be able to update the community', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = [];
    expect(service.canUpdateCommunity(deposit)).toBe(false);
  });

  it('user should be able to update deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = ['update'];
    expect(service.canUpdateDeposit(deposit)).toBe(true);
  });

  it('user should be able to update the community', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = ['updateCommunity'];
    expect(service.canUpdateCommunity(deposit)).toBe(true);
  });

  it('user should not be able to delete deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = [];
    expect(service.canDeleteDeposit(deposit)).toBe(false);
  });

  it('user should be able to delete deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = ['delete'];
    expect(service.canDeleteDeposit(deposit)).toBe(true);
  });

  it('user should not be able to comment deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = [];
    expect(service.canCreateCommentDeposit(deposit)).toBe(false);
  });

  it('user should be able to comment deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.creator = 'other';
    deposit.actions = ['createComment'];
    expect(service.canCreateCommentDeposit(deposit)).toBe(true);
  });

  it('user should not be able to review deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions = [];
    expect(service.canReviewDeposit(deposit)).toBe(false);
  });

  it('user should be able to review deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.creator = 'other';
    deposit.actions = ['review'];
    expect(service.canReviewDeposit(deposit)).toBe(true);
  });

  it('author should be able to manage deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.creator = profile._id;
    deposit.actions.push('edit');
    expect(service.canEditDeposit(deposit)).toBe(true);
  });

  it('moderator should be able to manage deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.communityPopulated = community;
    profile.roles.push(`moderator:${community._id}`);
    deposit.actions.push('edit');
    expect(service.canEditDeposit(deposit)).toBe(true);
  });

  it('admin should be able to manage deposit', () => {
    profile.roles.push('admin');
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions.push('edit');
    expect(service.canEditDeposit(deposit)).toBe(true);
  });

  it('if its not the owner it should NOT be able to manage deposit', () => {
    expect(service.canEditDeposit(factoryDepositPopulatedDTO.build())).toBe(false);
  });

  it('moderator should be able to moderate deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.communityPopulated = community;
    profile.roles.push(`moderator:${community._id}`);
    deposit.actions.push('moderate');
    expect(service.canModerateDeposit(deposit)).toBe(true);
  });

  it('admin should be able to moderate deposit', () => {
    profile.roles.push('admin');
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions.push('moderate');
    expect(service.canModerateDeposit(deposit)).toBe(true);
  });

  it('user should be able to read deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.creator = 'other';
    deposit.actions = ['read'];
    expect(service.canReadDeposit(deposit)).toBe(true);
  });

  it('user should not be able to read deposit', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.creator = 'other';
    deposit.actions = [];
    expect(service.canReadDeposit(deposit)).toBe(false);
  });

  it('author should be able to invite reviewers', () => {
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.creator = profile._id;
    deposit.actions.push('inviteReviewers');
    expect(service.canInviteReviewers(deposit)).toBe(true);
  });

  it('admin should be able to invite reviewers', () => {
    profile.roles.push('admin');
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions.push('inviteReviewers');
    expect(service.canInviteReviewers(deposit)).toBe(true);
  });

  it('neither admin nor author should be able to invite reviewers', () => {
    profile.roles.push('admin');
    const deposit = factoryDepositPopulatedDTO.build();
    expect(service.canInviteReviewers(deposit)).toBe(false);
  });

  it('if its not the owner it should NOT be able to invite reviewers', () => {
    expect(service.canInviteReviewers(factoryDepositPopulatedDTO.build())).toBe(false);
  });

  it('admin and author should be able to create versions', () => {
    profile.roles.push('admin');
    const deposit = factoryDepositPopulatedDTO.build();
    deposit.actions.push('createVersion');
    expect(service.canCreateVersion(deposit)).toBe(true);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
