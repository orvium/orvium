import { Directive, ElementRef, Input, OnChanges, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appAvatar]',
  standalone: true,
})
export class AvatarDirective implements OnInit, OnChanges {
  private defaultGravatar = '2e7854c294602808422223306eff0e33';

  @Input() gravatar: string | undefined;
  @Input() applyStyle = true;

  constructor(private elementRef: ElementRef<HTMLImageElement>) {}

  ngOnInit(): void {
    if (this.applyStyle) {
      this.elementRef.nativeElement.style.borderRadius = '50%';
      this.elementRef.nativeElement.style.margin = '0.25rem';
      this.elementRef.nativeElement.style.height = '2rem';
      this.elementRef.nativeElement.style.width = '2rem';
      this.elementRef.nativeElement.style.objectFit = 'cover';
    }
  }

  ngOnChanges(): void {
    // We need to retrieve the src using this.elementRef.nativeElement.getAttribute('src')
    // because accessing directly this.elementRef.nativeElement.src defaults to the root url string (so it is never null)
    const src = this.elementRef.nativeElement.getAttribute('src');
    if (!src || src.startsWith('https://www.gravatar.com/avatar')) {
      this.elementRef.nativeElement.src = `https://www.gravatar.com/avatar/${
        this.gravatar ?? this.defaultGravatar
      }?d=identicon`;
    }
  }
}
