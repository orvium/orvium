import { CopyToClipboardDirective } from './copy-to-clipboard.directive';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { ClipboardModule } from '@angular/cdk/clipboard';

describe('Directive: CopyToClipboardDirective', () => {
  beforeEach(() => MockBuilder(CopyToClipboardDirective).keep(ClipboardModule));

  it('should verify copy', () => {
    const fixture = MockRender(`<button [appCopyToClipboard]="'content to be copied'"></button>`);
    const instance = ngMocks.get(fixture.point, CopyToClipboardDirective);
    jest.spyOn(instance.clipboard, 'copy').mockReturnValue(true);
    jest.spyOn(instance.snackBarService, 'info');
    fixture.point.triggerEventHandler('click', null);
    expect(instance.text).toEqual('content to be copied');
    expect(instance.snackBarService.info).toHaveBeenCalled();
  });

  it('should show message when copy fails', () => {
    const fixture = MockRender(`<button [appCopyToClipboard]="'content to be copied'"></button>`);
    const instance = ngMocks.get(fixture.point, CopyToClipboardDirective);
    jest.spyOn(instance.clipboard, 'copy').mockReturnValue(false);
    jest.spyOn(instance.snackBarService, 'error');
    fixture.point.triggerEventHandler('click', null);
    expect(instance.text).toEqual('content to be copied');
    expect(instance.snackBarService.error).toHaveBeenCalled();
  });
});
