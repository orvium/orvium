import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'encodeURIComponent',
  standalone: true,
})
export class EncodeURIComponentPipe implements PipeTransform {
  transform(input: string): string {
    return encodeURIComponent(input);
  }
}
