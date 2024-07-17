import { Component } from '@angular/core';
import { factoryUserPrivateDTO } from '../../shared/test-data';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ProfileMenuComponent } from '../../profile/profile-menu/profile-menu.component';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserPrivateDTO } from '@orvium/api';

@Component({
  selector: 'app-profile-menu-demo',
  standalone: true,
  templateUrl: './profile-menu-demo.component.html',
  styleUrls: ['./profile-menu-demo.component.scss'],
  imports: [
    MatButtonModule,
    MatMenuModule,
    ProfileMenuComponent,
    MatIconModule,
    MatSlideToggleModule,
    RouterLink,
  ],
})
export class ProfileMenuDemoComponent {
  public user: UserPrivateDTO = factoryUserPrivateDTO.build();
}
