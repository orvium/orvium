import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileCardComponent } from './file-card.component';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { MatChipsModule } from '@angular/material/chips';
import { factoryFileMetadata } from '../test-data';

describe('FileCardComponent', () => {
  let component: FileCardComponent;
  let fixture: ComponentFixture<FileCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileCardComponent, MatChipsModule, FontAwesomeTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileCardComponent);
    component = fixture.componentInstance;
    component.file = factoryFileMetadata.build();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open new window', () => {
    const spy = jest.spyOn(window, 'open').mockImplementation();

    component.openLink();
    expect(spy).toHaveBeenCalled();
  });

  it('should delete file', () => {
    component.canDelete = true;
    component.file = factoryFileMetadata.build();
    jest.spyOn(component.fileDeleted, 'emit');
    component.deleteFile(
      { stopPropagation: () => console.log('stopPropagation') } as MouseEvent,
      component.file
    );

    expect(component.fileDeleted.emit).toHaveBeenCalledWith(component.file);
  });
});
