import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallForPapersCardComponent } from '../../call/call-for-papers-card/call-for-papers-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { InputWithChipsComponent } from '../../shared/input-with-chips/input-with-chips.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-chips-demo',
  standalone: true,
  imports: [
    CommonModule,
    CallForPapersCardComponent,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    InputWithChipsComponent,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatInputModule,
    MatExpansionModule,
  ],
  templateUrl: './chips-demo.component.html',
  styleUrls: ['./chips-demo.component.scss'],
})
export class ChipsDemoComponent {
  disciplines = [
    'Science',
    'Math',
    'BiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiologyBiology',
  ];
  demoForm = new FormControl([...this.disciplines]);
}
