import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

describe('DialogService', () => {
  let service: DialogService;

  let template: TemplateRef<unknown>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [MatDialogModule, NoopAnimationsModule],
      providers: [FormBuilder],
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should close all', () => {
    const spy = jest.spyOn(service._dialogService, 'closeAll');
    service.closeAll();
    expect(spy).toHaveBeenCalled();
  });

  it('should create open Confirm', () => {
    const matDialogRef = service.openConfirm({ cancelMessage: 'cancel', acceptMessage: 'Accept' });
    expect(matDialogRef).toBeDefined();
  });

  it('should create open Alert', () => {
    const matDialogRef = service.openAlert({ acceptMessage: 'Accept' });
    expect(matDialogRef).toBeDefined();
  });

  it('should create open Input', () => {
    const matDialogRef = service.openInputDialog({
      cancelMessage: 'cancel',
      acceptMessage: 'Accept',
    });
    expect(matDialogRef).toBeDefined();
  });

  it('should create open input with textarea', () => {
    const matDialogRef = service.openInputDialog({
      cancelMessage: 'cancel',
      acceptMessage: 'Accept',
      useTextarea: true,
    });
    expect(matDialogRef).toBeDefined();
  });

  it('should create open Custom', () => {
    const matDialogRef = service.openCustom({
      showActionButtons: true,
      template: template,
      acceptMessage: 'Accept',
      cancelMessage: 'Cancel',
    });
    expect(matDialogRef).toBeDefined();
  });

  it('should create open Video', () => {
    const matDialogRef = service.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/781ba680-a6d3-43f9-b0b2-4e5c62d93d2f/versions/12/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
    expect(matDialogRef).toBeDefined();
  });
});
