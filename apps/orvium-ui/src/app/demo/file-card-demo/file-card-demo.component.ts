import { Component } from '@angular/core';
import { FileCardComponent } from '../../shared/file-card/file-card.component';

import { FileMetadata } from '@orvium/api';

@Component({
  selector: 'app-file-card-demo',
  standalone: true,
  imports: [FileCardComponent],
  templateUrl: './file-card-demo.component.html',
  styleUrls: ['./file-card-demo.component.scss'],
})
export class FileCardDemoComponent {
  files: FileMetadata[] = [
    {
      filename: 'docx',
      description: 'docx',
      contentType: 'file-word',
      contentLength: 12311213,
      tags: ['tag1', 'tag2'],
      url: 'http://localhost:4200/favicon.ico',
    },
    {
      filename: 'csv',
      description: 'csv',
      contentType: 'file-csv',
      contentLength: 1231123,
      tags: ['tag1', 'tag2'],
      url: 'http://localhost:4200/favicon.ico',
    },
    {
      filename: 'pdf',
      description: 'pdf',
      contentType: 'file-pdf',
      contentLength: 123123,
      tags: ['tag1', 'tag2'],
      url: 'http://localhost:4200/favicon.ico',
    },
    {
      filename: 'image',
      description: 'image',
      contentType: 'file-image',
      contentLength: 123123,
      tags: ['tag1', 'tag2'],
      url: 'http://localhost:4200/favicon.ico',
    },
    {
      filename: 'example.tex',
      description: 'example.tex',
      contentType: 'file-x-tex',
      contentLength: 123123,
      tags: ['tag1', 'tag2'],
      url: 'http://localhost:4200/favicon.ico',
    },
    {
      filename: 'other file',
      description: 'other file',
      contentType: 'file-non-existing',
      contentLength: 123123,
      tags: ['tag1', 'tag2'],
      url: 'http://localhost:4200/favicon.ico',
    },
  ];
}
