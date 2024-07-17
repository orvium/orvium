import { TestBed } from '@angular/core/testing';
import BookmarkedDepositsComponent from './bookmarked-deposits.component';
import { DisciplinesService } from '../../services/disciplines.service';
import { DefaultService } from '@orvium/api';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DepositsListComponent } from '../deposits-list/deposits-list.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('BookmarkedDepositsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BookmarkedDepositsComponent,
        NoopAnimationsModule,
        MockComponent(DepositsListComponent),
        RouterTestingModule,
      ],
      providers: [
        MockProvider(DisciplinesService, {
          getDisciplines: jest.fn().mockReturnValue(of([])),
        }),
        MockProvider(DefaultService, {
          getMyStarredDeposits: jest.fn().mockReturnValue(of([])),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(BookmarkedDepositsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
