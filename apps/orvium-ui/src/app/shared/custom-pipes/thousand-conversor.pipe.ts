import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thousandConversor',
  standalone: true,
})
export class ThousandConversorPipe implements PipeTransform {
  digits = ['k', 'M', 'G'];

  transform(value: number, ...args: unknown[]): string {
    const digit = Math.floor((value.toString().length - 1) / 3);
    return digit === 0
      ? value.toString()
      : `${
          // The Number wrapper removes insignificant trailing zeros, e.g. 1.50 is transformed to 1.5
          Number((value / Math.pow(1000, digit)).toFixed(2))
        }${this.digits[digit - 1]}`;
  }
}
