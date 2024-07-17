import { EditModeratorNotificationsDialogComponent } from './edit-moderator-notifications-dialog.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { factoryCommunityModeratorDTO } from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

const data = {
  communityTracks: ['track'],
  moderator: factoryCommunityModeratorDTO.build({ notificationOptions: undefined }),
};
describe('EditModeratorNotificationsDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditModeratorNotificationsDialogComponent],
      providers: [MockProvider(MAT_DIALOG_DATA, data), MockProvider(MatDialogRef)],
    });
  });

  it('should create', () => {
    const fixture = MockRender(EditModeratorNotificationsDialogComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should close', () => {
    const fixture = MockRender(EditModeratorNotificationsDialogComponent);
    const spy = jest.spyOn(fixture.point.componentInstance.dialogRef, 'close');
    fixture.point.componentInstance.close();
    expect(spy).toHaveBeenCalled();
  });

  it('should submit', () => {
    const moderatorTest = factoryCommunityModeratorDTO.build();
    const fixture = MockRender(EditModeratorNotificationsDialogComponent, {
      editNotificationsForm: ['id1', 'id2'],
    });
    const spy = jest.spyOn(fixture.point.componentInstance.dialogRef, 'close');
    fixture.point.componentInstance.submitNotifications(moderatorTest);
    fixture.point.componentInstance.close();
    expect(spy).toHaveBeenCalled();
  });
});
