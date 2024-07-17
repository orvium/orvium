import { Component } from '@angular/core';
import { DEPOSITSTATUS_LOV, REVIEWSTATUS_LOV } from '../../model/orvium';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { DepositStatusInfoComponent } from '../../deposits/deposit-status-info/deposit-status-info.component';
import { ReviewStatusInfoComponent } from '../../review/review-status-info/review-status-info.component';

@Component({
  selector: 'app-demo-status-info-demo',
  standalone: true,
  templateUrl: './status-info-demo.component.html',
  styleUrls: ['./status-info-demo.component.scss'],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    DepositStatusInfoComponent,
    ReviewStatusInfoComponent,
  ],
})
export class StatusInfoDemoComponent {
  protected readonly DEPOSITSTATUS_LOV = DEPOSITSTATUS_LOV;
  protected readonly REVIEWSTATUS_LOV = REVIEWSTATUS_LOV;
}
