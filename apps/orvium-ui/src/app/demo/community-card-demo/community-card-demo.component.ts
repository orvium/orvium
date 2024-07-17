import { Component } from '@angular/core';

import { CommunityCardComponent } from '../../communities/community-card/community-card.component';
import { CommunityDTO } from '@orvium/api';
import { factoryCommunityDTO } from '../../shared/test-data';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-community-card-demo',
  standalone: true,
  imports: [CommunityCardComponent, RouterLink],
  templateUrl: './community-card-demo.component.html',
  styleUrls: ['./community-card-demo.component.scss'],
})
export class CommunityCardDemoComponent {
  communities: CommunityDTO[] = [
    factoryCommunityDTO.build({
      cardImageUrl:
        'https://store.hp.com/app/assets/images/uploads/prod/25-best-hd-wallpapers-laptops159561982840438.jpg',
    }),
    factoryCommunityDTO.build({
      cardImageUrl:
        'https://store.hp.com/app/assets/images/uploads/prod/25-best-hd-wallpapers-laptops159561982840438.jpg',
    }),
    factoryCommunityDTO.build({
      cardImageUrl: 'https://assets.orvium.io/disposable/bosque.jpg',
    }),
    factoryCommunityDTO.build(),
  ];
}
