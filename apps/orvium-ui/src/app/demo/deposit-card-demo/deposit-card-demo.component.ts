import { Component } from '@angular/core';
import { DepositPopulatedDTO } from '@orvium/api';
import { factoryDepositPopulatedDTO, factoryReviewPopulatedDTO } from '../../shared/test-data';
import { DepositCardComponent } from '../../deposits/deposit-card/deposit-card.component';

@Component({
  selector: 'app-demo-deposit-card-demo',
  standalone: true,
  templateUrl: './deposit-card-demo.component.html',
  styleUrls: ['./deposit-card-demo.component.scss'],
  imports: [DepositCardComponent],
})
export class DepositCardDemoComponent {
  deposit2: DepositPopulatedDTO = factoryDepositPopulatedDTO.build({
    socialComments: 1,
  });
  deposit: DepositPopulatedDTO = factoryDepositPopulatedDTO.build({
    peerReviewsPopulated: [factoryReviewPopulatedDTO.build(), factoryReviewPopulatedDTO.build()],
  });
  deposit3: DepositPopulatedDTO = factoryDepositPopulatedDTO.build({
    socialComments: 1,
  });

  deposit4: DepositPopulatedDTO = factoryDepositPopulatedDTO.build({
    peerReviewsPopulated: [factoryReviewPopulatedDTO.build()],
  });

  deposit5: DepositPopulatedDTO = factoryDepositPopulatedDTO.build({
    title: 'Testing deposit card in UX',
    socialComments: 1,
  });
}
