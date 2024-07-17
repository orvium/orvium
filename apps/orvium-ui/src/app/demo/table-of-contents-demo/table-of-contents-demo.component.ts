import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { TableOfContentsComponent } from '../../shared/table-of-contents/table-of-contents.component';

@Component({
  selector: 'app-table-of-contents-demo',
  standalone: true,
  templateUrl: './table-of-contents-demo.component.html',
  styleUrls: ['./table-of-contents-demo.component.scss'],
  imports: [TableOfContentsComponent],
})
export class TableOfContentsDemoComponent implements AfterViewInit {
  @ViewChild('toc') tableOfContents!: TableOfContentsComponent;
  @ViewChild('component') component!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.tableOfContents.addHeaders('Navigation Demo', this.component.nativeElement);
  }
}
