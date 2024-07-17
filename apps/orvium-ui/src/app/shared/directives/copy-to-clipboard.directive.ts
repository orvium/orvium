import { Directive, HostListener, Input } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { AppSnackBarService } from '../../services/app-snack-bar.service';

@Directive({
  selector: '[appCopyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective {
  @Input() message = 'Copied to clipboard';
  @Input('appCopyToClipboard') text = '';

  constructor(
    public clipboard: Clipboard,
    public snackBarService: AppSnackBarService
  ) {}

  @HostListener('click') copyToClipboard(): void {
    if (this.clipboard.copy(this.text)) {
      this.snackBarService.info(this.message);
    } else {
      this.snackBarService.error('Copy to clipboard failed!');
    }
  }
}
