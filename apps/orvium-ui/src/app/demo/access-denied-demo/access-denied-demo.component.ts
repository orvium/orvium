import { Component } from '@angular/core';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';

@Component({
  selector: 'app-access-denied-demo',
  standalone: true,
  templateUrl: './access-denied-demo.component.html',
  styleUrls: ['./access-denied-demo.component.scss'],
  imports: [AccessDeniedComponent],
})
export class AccessDeniedDemoComponent {}
