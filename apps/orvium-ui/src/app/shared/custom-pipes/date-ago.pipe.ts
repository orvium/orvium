import { Pipe, PipeTransform } from '@angular/core';

const dateagoMap = new Map([
  ['year', 31536000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]);

@Pipe({
  name: 'dateAgo',
  standalone: true,
  pure: true,
})
export class DateAgoPipe implements PipeTransform {
  transform(value: Date | number): string {
    const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);

    if (seconds < 29) return 'Just now';

    let message = '';
    for (const [key, value] of dateagoMap) {
      const counter = Math.floor(seconds / value);
      if (counter > 0) {
        let intervalText = key;
        if (counter > 1) {
          intervalText = key + 's'; // add "s" for plural (e.g. 2 days ago)
        }

        message = `${counter} ${intervalText}`;
        break;
      }
    }
    return message;
  }
}
