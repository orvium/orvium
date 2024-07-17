import { Component, OnInit } from '@angular/core';
import { ReviewPopulatedDTO } from '@orvium/api';
import { REVIEWDECISION_LOV, ReviewDecisionLov } from '../../model/orvium';
import { factoryReviewPopulatedDTO } from '../../shared/test-data';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-demo-contributor-line-demo',
  standalone: true,
  templateUrl: './contributor-line-demo.component.html',
  styleUrls: ['./contributor-line-demo.component.scss'],
  imports: [ContributorLineComponent, MatChipsModule, MatIconModule, MatFormFieldModule],
})
export class ContributorLineDemoComponent implements OnInit {
  decisionSelected: ReviewDecisionLov | undefined;
  review: ReviewPopulatedDTO = factoryReviewPopulatedDTO.build();

  ngOnInit(): void {
    this.decisionSelected = REVIEWDECISION_LOV.find(x => x.value === this.review.decision);
  }
}
