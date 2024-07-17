import { Component } from '@angular/core';
import { factoryDepositPopulatedDTO } from '../../shared/test-data';
import { AfterSubmitViewComponent } from '../../deposits/after-submit-view/after-submit-view.component';

@Component({
  selector: 'app-after-submit-view-demo',
  standalone: true,
  imports: [AfterSubmitViewComponent],
  templateUrl: './after-submit-view-demo.component.html',
  styleUrls: ['./after-submit-view-demo.component.scss'],
})
export class AfterSubmitViewDemoComponent {
  deposit = factoryDepositPopulatedDTO.build();
}
