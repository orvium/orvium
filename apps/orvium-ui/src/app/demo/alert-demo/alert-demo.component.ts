import { Component } from '@angular/core';
import { AlertComponent } from '../../shared/alert/alert.component';

@Component({
  selector: 'app-alert-demo',
  standalone: true,
  templateUrl: './alert-demo.component.html',
  styleUrls: ['./alert-demo.component.scss'],
  imports: [AlertComponent],
})
export class AlertDemoComponent {}
