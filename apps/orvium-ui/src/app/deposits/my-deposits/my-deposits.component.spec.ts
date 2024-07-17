import MyDepositsComponent from './my-deposits.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { DefaultService } from '@orvium/api';
import { of } from 'rxjs';
import { factoryDepositPopulatedDTO } from '../../shared/test-data';
import { DialogService } from '../../dialogs/dialog.service';
import { TestBed } from '@angular/core/testing';
import { EmptyStatePublicationsComponent } from '../../shared/empty-state-publications/empty-state-publications.component';
import { DepositsListComponent } from '../deposits-list/deposits-list.component';

describe('MyworkComponent', () => {
  const deposits = factoryDepositPopulatedDTO.buildList(1);
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MyDepositsComponent,
        RouterTestingModule,
        MockComponent(EmptyStatePublicationsComponent),
        MockComponent(DepositsListComponent),
      ],
      providers: [
        MockProvider(DefaultService, {
          getMyDeposits: jest.fn().mockReturnValue(of(deposits)),
        }),
        MockProvider(DialogService, {
          openVideo: jest.fn().mockImplementation(),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(MyDepositsComponent);
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should open video dialog', () => {
    const fixture = MockRender(MyDepositsComponent);
    fixture.point.componentInstance.openVideo();
  });
});
