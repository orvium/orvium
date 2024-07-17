import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogWrapperComponent, DialogWrapperData } from './dialog-wrapper.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MockProvider } from 'ng-mocks';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dummy',
  standalone: true,
  template: `<h1>Dummy</h1>`,
  imports: [],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class DummyComponent {}

describe('DialogWrapperComponent', () => {
  let component: DialogWrapperComponent;
  let fixture: ComponentFixture<DialogWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogWrapperComponent],
      providers: [
        MockProvider(MatDialogRef),
        MockProvider(MAT_DIALOG_DATA, {
          title: 'Dialog title',
          component: DummyComponent,
        } as DialogWrapperData),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
