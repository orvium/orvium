import { MockProvider, MockRender } from 'ng-mocks';
import { AuthorDTO } from '@orvium/api';
import { AuthorAvatarListComponent } from './author-avatar-list.component';
import { TestBed } from '@angular/core/testing';
import { DialogService } from '../../dialogs/dialog.service';

describe('AppAuthorAvatarListComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthorAvatarListComponent],
      providers: [
        MockProvider(DialogService, {
          open: jest.fn().mockImplementation(),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(AuthorAvatarListComponent, { authors: [] as AuthorDTO[] });
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should open authors list dialog', () => {
    const fixture = MockRender(AuthorAvatarListComponent, { authors: [] as AuthorDTO[] });
    const dialogService = fixture.point.injector.get(DialogService);
    fixture.point.componentInstance.openAuthorsPopup();
    expect(dialogService.open).toHaveBeenCalled();
  });
});
