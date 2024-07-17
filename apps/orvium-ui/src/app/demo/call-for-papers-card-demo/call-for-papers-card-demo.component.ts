import { Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { CallForPapersCardComponent } from '../../call/call-for-papers-card/call-for-papers-card.component';
import { factoryCallDTO } from '../../shared/test-data';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-call-for-papers-card-demo',
  standalone: true,
  imports: [MatIconModule, CallForPapersCardComponent, MatButtonModule],
  templateUrl: './call-for-papers-card-demo.component.html',
  styleUrls: ['./call-for-papers-card-demo.component.scss'],
})
export class CallForPapersCardDemoComponent {
  callForPapers = factoryCallDTO.build();
  callForPapers2 = factoryCallDTO.build({
    title: 'This is another call for papers',
    disciplines: ['Acounting', 'Computer Science', 'Technology', 'Astrology'],
    scope:
      'The disruptions resulting from the COVID-19 ' +
      'pandemic have been unprecedented to the global economy, potentially leading to a deep and record global recession. All parties are ' +
      'inevitably affected but a good range of business functions have demonstrated a high degree of resilience against all the odds and ' +
      'have continued to evolve. While many companies have failed to maintain a healthy position despite the support of the pandemic relief' +
      ' schemes provided by the governments, many others have seized the opportunity to create a different type of normal to survive the' +
      ' economic fallout from COVID-19. Moreover, many East Asian cities have kept the virus in check without having to impose hard' +
      ' nationwide lockdowns. The benefits of some approaches are clear to see, why were there only a few attempts to replicate Asian' +
      ' responses to COVID-19 in the West? Was it the difference in culture? Was it a difference in ideologies and identities? ' +
      'Was it the difference in the geopolitical landscape? Why have the generalizable strategic decisions become questionably' +
      ' ungeneralizable? Did the East and West have different normals in the past and will the post-COVID era lead us to many ' +
      'different ‘normals’? Amidst the discussion about anti-pandemic measures imposed by the governments and their adverse ' +
      'impacts on economies, many companies have reset priorities, devised new strategies and repositioned themselves through ' +
      'speeding up their digital transformation, and data-centric networking and decision making. The attitudinal change towards' +
      ' hygiene and cleanliness, behavioural changes in leisure and shopping, customers’ rising expectations on their experience ' +
      'on digital platforms have posed new challenges to the existing businesses as well as opening up opportunities for new businesses.' +
      ' New businesses have emerged and flourished while those which adopted a wait-and-see strategy paid the price. COVID-19 has kicked' +
      ' off a new business cycle and the new normal will soon become the norm. It would be of interest to both the academia and business ' +
      'practitioners to discover how organisations structure themselves and recast business strategy and priorities, both within and across' +
      ' organisational boundaries, and to embrace the new normal at various levels of their operations in order to stay sophisticated, ' +
      'competitive and resilient in the post-COVID-19 era. We invite competitive papers and posters which respond to the theme of the' +
      ' conference. Conceptual, theoretical, and empirical papers, using qualitative and/or quantitative methodologies are welcome. ' +
      'We have identified a good range of sub-themes; however, we are happy to also consider papers that are not directly related to ' +
      'these sub-themes but rather fit into the wider theme of the conference.',
    visible: false,
  });
}
