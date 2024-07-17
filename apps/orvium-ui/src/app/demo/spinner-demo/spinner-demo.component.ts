import { Component } from '@angular/core';
import { delay, of } from 'rxjs';
import { SpinnerService } from '../../spinner/spinner.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { LoadingSpinnerComponent } from '../../spinner/loading-spinner/loading-spinner.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { ModeratorDepositTableComponent } from '../../communities/moderator-deposit-table/moderator-deposit-table.component';
import { factoryCommunityPopulatedDTO, factoryDepositDTO } from '../../shared/test-data';

@Component({
  selector: 'app-demo-spinner-demo',
  standalone: true,
  templateUrl: './spinner-demo.component.html',
  styleUrls: ['./spinner-demo.component.scss'],
  imports: [
    MatCardModule,
    MatButtonModule,
    LoadingSpinnerComponent,
    OverlayLoadingDirective,
    ModeratorDepositTableComponent,
  ],
})
export class SpinnerDemoComponent {
  public isFetchingData = false;
  public isFetchingData2 = false;
  deposits = factoryDepositDTO.buildList(10);
  public community = factoryCommunityPopulatedDTO.build();
  constructor(public spinnerService: SpinnerService) {}

  activateSpinner(spinnerName: string): void {
    this.spinnerService.show(spinnerName);
    this.spinnerService.hide(spinnerName, 3000);
  }

  fetchTableData(): void {
    this.isFetchingData = true;
    of(true)
      .pipe(delay(2000))
      .subscribe(() => (this.isFetchingData = false));
  }

  fetchTableData2(): void {
    this.isFetchingData2 = true;
    of(true)
      .pipe(delay(2000))
      .subscribe(() => (this.isFetchingData2 = false));
  }
}
