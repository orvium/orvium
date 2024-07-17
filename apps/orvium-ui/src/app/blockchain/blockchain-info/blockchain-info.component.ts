import { Component } from '@angular/core';
import { BlockchainNetworkDTO } from '@orvium/api';
import { BlockchainService } from '../blockchain.service';
import { MatCardModule } from '@angular/material/card';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-blockchain-info',
  standalone: true,
  templateUrl: './blockchain-info.component.html',
  styleUrls: ['./blockchain-info.component.scss'],
  imports: [MatCardModule, MatIconModule],
})
export default class BlockchainInfoComponent {
  networks: BlockchainNetworkDTO[];

  constructor(private blockchainService: BlockchainService) {
    this.networks = this.blockchainService.networks;
  }
}
