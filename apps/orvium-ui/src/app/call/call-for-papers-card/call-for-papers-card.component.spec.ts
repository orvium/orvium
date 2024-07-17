import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CallForPapersCardComponent } from './call-for-papers-card.component';
import { MatIconModule } from '@angular/material/icon';
import { factoryCallDTO } from '../../shared/test-data';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('CallForPapersCardComponent', () => {
  let component: CallForPapersCardComponent;
  let fixture: ComponentFixture<CallForPapersCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CallForPapersCardComponent,
        MatChipsModule,
        MatListModule,
        MatCardModule,
        MatIconModule,
        MatTooltipModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CallForPapersCardComponent);
    component = fixture.componentInstance;
    component.callForPapers = factoryCallDTO.build();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
