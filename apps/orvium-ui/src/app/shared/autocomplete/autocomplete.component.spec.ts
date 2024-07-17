import { AutocompleteComponent } from './autocomplete.component';
import { MockRender, ngMocks } from 'ng-mocks';
import { factoryCommunityModeratorDTO } from '../test-data';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';

describe('AutocompleteComponent', () => {
  const moderators = factoryCommunityModeratorDTO.buildList(2);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AutocompleteComponent, NoopAnimationsModule],
    });
  });

  it('should create', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      currentValue: moderators[0],
    });
    expect(fixture.point.componentInstance.currentValue).toEqual(moderators[0]);
    expect(fixture.point.componentInstance).toBeDefined();
  });

  it('should disable input', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      disabled: true,
    });
    const input = ngMocks.find<MatInput>(fixture, 'input');
    expect(input.componentInstance.disabled).toEqual(true);
  });

  it('should displayEditorsName', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      currentValue: moderators[0],
    });
    const displayName = fixture.point.componentInstance.displayEditorsName(moderators[0]);
    expect(displayName).toBe(`${moderators[0].user.firstName} ${moderators[0].user.lastName}`);
  });

  it('should clearInput', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      currentValue: moderators[0],
    });
    const input = ngMocks.find(fixture, 'input');
    ngMocks.trigger(input, 'focusout');
    expect(fixture.point.componentInstance.currentValue).toEqual(moderators[0]);
  });

  it('should clearInput when no moderator assigned', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
    });
    const input = ngMocks.find<MatInput>(fixture, 'input');
    ngMocks.trigger(input, 'focusout');
    expect(input.componentInstance.value).toEqual(undefined);
  });

  it('should filter moderators', () => {
    moderators[1].user.firstName = 'Isabel';
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      currentValue: moderators[0],
    });
    fixture.point.componentInstance.inputElement.value = 'Isa';
    fixture.point.componentInstance.editorInputChanges({} as Event);
    expect(fixture.point.componentInstance.filteredArray).toEqual([moderators[1]]);
  });

  it('should removeEditor', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      currentValue: moderators[0],
    });
    const icon = ngMocks.find(fixture, 'mat-icon');
    ngMocks.click(icon);
    expect(fixture.point.componentInstance.currentValue).toBeUndefined();
  });

  it('should onEditorSelect', () => {
    const fixture = MockRender(AutocompleteComponent, {
      moderators: moderators,
      currentValue: moderators[0],
    });
    fixture.point.componentInstance.onEditorSelect({
      option: { value: moderators[1] },
    } as MatAutocompleteSelectedEvent);
    expect(fixture.point.componentInstance.currentValue).toEqual(moderators[1]);
  });
});
