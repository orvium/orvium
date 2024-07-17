import { SidenavService } from './sidenav.service';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SidenavService', () => {
  beforeEach(() => MockBuilder(SidenavService).keep(MatSidenavModule).keep(NoopAnimationsModule));

  it('should be created', () => {
    const fixture = MockRender(SidenavService);
    expect(fixture).toBeTruthy();
  });

  it('should open/close sidenav', () => {
    const fixture = MockRender(`
    <mat-sidenav-container>
      <mat-sidenav>Start</mat-sidenav>
      <mat-sidenav-content>Main</mat-sidenav-content>
    </mat-sidenav-container>
`);
    const service = ngMocks.get(SidenavService);
    const sidenav = ngMocks.find(MatSidenav);
    service.setSidenav(sidenav.componentInstance);
    expect(service.getSidenav()).toBeDefined();

    void service.open();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(true);

    void service.close();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(false);

    void sidenav.componentInstance.open();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(true);

    void service.toggle();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(false);
  });

  it('should open/close right sidenav', () => {
    const fixture = MockRender(`
    <mat-sidenav-container>
      <mat-sidenav>Start</mat-sidenav>
      <mat-sidenav-content>Main</mat-sidenav-content>
    </mat-sidenav-container>
`);
    const service = ngMocks.get(SidenavService);
    const sidenav = ngMocks.find(MatSidenav);
    service.setRightSidenav(sidenav.componentInstance);

    void service.openRight();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(true);

    void service.closeRight();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(false);

    void service.toggleRight();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(true);

    void service.toggleRight();
    fixture.detectChanges();
    expect(sidenav.componentInstance.opened).toBe(false);
  });

  it('should fail when no sidenav assigned', async () => {
    MockRender(SidenavService);
    const service = ngMocks.get(SidenavService);
    expect(() => service.getSidenav()).toThrow(new Error('Left sidenav not available'));
    await expect(service.close()).rejects.toThrow('Left sidenav not available');
    await expect(service.closeRight()).rejects.toThrow('Right sidenav not available');
    await expect(service.open()).rejects.toThrow('Left sidenav not available');
    await expect(service.openRight()).rejects.toThrow('Right sidenav not available');
    await expect(service.toggle()).rejects.toThrow('Left sidenav not available');
    await expect(service.toggleRight()).rejects.toThrow('Right sidenav not available');
  });
});
