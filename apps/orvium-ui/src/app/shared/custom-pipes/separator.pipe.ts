import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'separator', standalone: true })
export class SeparatorPipe implements PipeTransform {
  transform(value: string[], separator: string): string {
    let commas = '';
    for (const i of value) {
      commas = commas + i + separator + ' ';
    }
    return commas.slice(0, -2);
  }
}
