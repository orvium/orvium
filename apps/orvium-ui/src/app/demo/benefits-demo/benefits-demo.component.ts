import { Component } from '@angular/core';
import { Benefit, BenefitComponent } from '../../shared/benefit/benefit.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-benefits-demo',
  standalone: true,
  templateUrl: './benefits-demo.component.html',
  styleUrls: ['./benefits-demo.component.scss'],
  imports: [MatCardModule, BenefitComponent],
})
export class BenefitsDemoComponent {
  benefit: Benefit = {
    title: 'Impact',
    icon: 'stacked_line_chart',
    description: 'Publish <b>open acess</b> and get exposure, increase your impact!',
  };
}
