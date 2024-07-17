import { TestBed } from '@angular/core/testing';

import { CommunityService } from './community.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { factoryCommunityPopulatedDTO } from '../shared/test-data';
import { DefaultService } from '@orvium/api';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { AppSnackBarService } from '../services/app-snack-bar.service';
import { DialogService } from '../dialogs/dialog.service';
import {
  InputDialogComponent,
  InputDialogResponse,
} from '../dialogs/input-dialog/input-dialog.component';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('CommunityService', () => {
  let service: CommunityService;
  const communities = [factoryCommunityPopulatedDTO.build()];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatDialogModule, MatSnackBarModule, RouterModule],
    });
    service = TestBed.inject(CommunityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('user should return correct actions', () => {
    const community = factoryCommunityPopulatedDTO.build();
    const noActions = service.getCommunityActions(community);
    expect(noActions).toStrictEqual({
      update: false,
      moderate: false,
      submit: false,
    });

    community.actions = ['submit'];
    const someActions = service.getCommunityActions(community);
    expect(someActions).toStrictEqual({
      update: false,
      moderate: false,
      submit: true,
    });

    community.actions = ['submit', 'moderate', 'update'];
    const allActions = service.getCommunityActions(community);
    expect(allActions).toStrictEqual({
      update: true,
      moderate: true,
      submit: true,
    });
  });

  it('should create community dialog', () => {
    const dialogService = TestBed.inject(DialogService);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true, inputValue: 'test' }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    // eslint-disable-next-line
    jest.spyOn(apiService, 'createCommunity').mockReturnValue(of(communities[0] as any));
    service.createCommunityDialog();
    expect(dialogService.openInputDialog).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['communities', communities[0]._id, 'edit']);
  });

  it('should create community dialog empty', () => {
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    const snackBarService = TestBed.inject(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'error');
    service.createCommunityDialog();
    expect(spySnackBar).toHaveBeenCalledWith('Community Name should not be empty');
  });

  it('should handle community dialog exit', () => {
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of(undefined),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    service.createCommunityDialog();
  });
});
