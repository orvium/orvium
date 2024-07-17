import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  AcceptedFor,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  CommunityType,
  DepositStatus,
  InviteStatus,
  ReviewKind,
  ReviewStatus,
} from '@orvium/api';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  DEPOSITDECISION_LOV,
  DEPOSITSTATUS_LOV,
  INVITESTATUS_LOV,
  PAYMENTSTATUS_LOV,
  REVIEWKIND_LOV,
  REVIEWSTATUS_LOV,
} from '../../model/orvium';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgClass } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Utility type to define a subset of a parent type. */
export type SubsetType<ParentType, Type> = {
  [P in keyof ParentType]?: Type;
};
/** A type for control configuration using the SearchForm as the parent type and boolean as the type. */
type ControlConfig = SubsetType<SearchForm, boolean>;

/** A utility type to enforce that a set of keys must exist in a type. */
type MustHaveKeys<V, S extends Record<keyof V, unknown>> = S;

interface SearchForm {
  query: FormControl<string | null>;
  status: FormControl<DepositStatus | null>;
  reviewStatus: FormControl<ReviewStatus | null>;
  reviewKind: FormControl<ReviewKind | null>;
  inviteStatus: FormControl<InviteStatus | null>;
  newTrackTimestamp: FormControl<number | null>;
  sort: FormControl<string>;
  moderator: FormControl<string | null>;
  acceptedFor: FormControl<string | null>;
  paymentStatus: FormControl<string | null>;
  ids: FormControl<string[] | null>;
  dateLimit: FormControl<Date | null>;
}

type SearchFormRawValue = MustHaveKeys<
  SearchForm,
  {
    query: string | null;
    status: DepositStatus | null;
    reviewStatus: ReviewStatus | null;
    reviewKind: ReviewKind | null;
    inviteStatus: InviteStatus | null;
    newTrackTimestamp: number | null;
    sort: string;
    moderator: string | null;
    acceptedFor: string | null;
    ids: string[] | null;
    paymentStatus: string | null;
    dateLimit: Date | null;
  }
>;

/**
 * Component for the search box, allowing users to search using various filters.
 */
@Component({
  selector: 'app-search-box',
  standalone: true,
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    NgClass,
  ],
})
export class SearchBoxComponent implements OnInit {
  /** Default publication statuses. */
  _defaultPublicationStatus = [DepositStatus.Preprint, DepositStatus.Published];

  /** Default review statuses. */
  _defaultReviewStatus = [ReviewStatus.PendingApproval, ReviewStatus.Published, ReviewStatus.Draft];

  /** Default review kinds. */
  _defaultReviewKind = [ReviewKind.PeerReview, ReviewKind.CopyEditing];

  /** Default deposit decisions. */
  _defaultDepositDecision = [AcceptedFor.Presentation, AcceptedFor.Poster, AcceptedFor.None];

  /** Default invite statuses. */
  _defaultInviteStatus = [InviteStatus.Pending, InviteStatus.Rejected, InviteStatus.Accepted];

  /**
   * The form group for the search form.
   */
  searchFormGroup = this.formBuilder.group<SearchForm>({
    query: new FormControl<string | null>(null),
    status: new FormControl<DepositStatus | null>(null),
    reviewStatus: new FormControl<ReviewStatus | null>(null),
    reviewKind: new FormControl<ReviewKind | null>(null),
    newTrackTimestamp: new FormControl<number | null>(null),
    sort: new FormControl<string>('recent', { nonNullable: true }),
    moderator: new FormControl<string | null>(null),
    acceptedFor: new FormControl<string | null>(null),
    inviteStatus: new FormControl<InviteStatus | null>(null),
    ids: new FormControl<string[] | null>(null),
    paymentStatus: new FormControl<string | null>(null),
    dateLimit: new FormControl<Date | null>(null),
  });

  /** The currently set community. */
  public _community?: CommunityPopulatedDTO | CommunityPrivateDTO;
  @Input() set community(communityDTO: CommunityPopulatedDTO | CommunityPrivateDTO) {
    this.searchFormGroup.reset();
    this._community = communityDTO;
  }

  /** Custom controls for the search form. */
  @Input() customControls?: ControlConfig;

  /** Custom publication statuses. */
  @Input() customPublicationStatus?: DepositStatus[];

  /** Custom review statuses. */
  @Input() customReviewStatus?: ReviewStatus[];

  /** Custom deposit decisions. */
  @Input() customDepositDecision?: AcceptedFor[];

  /** Custom invitation statuses. */
  @Input() customInvitationStatus?: InviteStatus[];

  /** Flag indicating if search info should be shown. */
  @Input() searchInfo = false;

  /** Flag indicating if column layout should be used. */
  @Input() columnLayout = false;

  /** Placeholder text for the search input. */
  @Input() searchPlaceholder = 'Title, Abstract, Author etc.';

  /** Event emitter for the search output. */
  @Output() search = new EventEmitter<SearchBoxOutput<ControlConfig>>();

  /**Form control for the query input. */
  queryFormControl = new FormControl('');

  /**
   * List of values for several aspects, deposit, invite, review, payment status, type of review, etc.
   */
  _DepositStatus_LOV = DEPOSITSTATUS_LOV;
  _ReviewStatus_LOV = REVIEWSTATUS_LOV;
  _ReviewKind_LOV = REVIEWKIND_LOV;
  _DepositDecision_LOV = DEPOSITDECISION_LOV;
  _CommunityType_LOV = CommunityType;
  _InviteStatus_LOV = INVITESTATUS_LOV;
  _PaymentStatus_LOV = PAYMENTSTATUS_LOV;

  /**
   * Constructor for SearchBoxComponent.
   *
   * @param formBuilder - The FormBuilder instance for creating form controls and groups.
   */
  constructor(private formBuilder: FormBuilder) {
    this.queryFormControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(value => {
        this.searchFormGroup.controls.query.setValue(value);
      });
  }

  /**
   * Initializes the component, setting up subscriptions to manage the component.
   */
  ngOnInit(): void {
    this._defaultPublicationStatus = this.customPublicationStatus ?? this._defaultPublicationStatus;
    this._defaultDepositDecision = this.customDepositDecision ?? this._defaultDepositDecision;
    this._DepositStatus_LOV = DEPOSITSTATUS_LOV.filter(value =>
      this._defaultPublicationStatus.includes(value.value)
    );
    this._ReviewStatus_LOV = REVIEWSTATUS_LOV.filter(value =>
      this._defaultReviewStatus.includes(value.value)
    );
    this._ReviewKind_LOV = REVIEWKIND_LOV.filter(value =>
      this._defaultReviewKind.includes(value.value)
    );
    this._DepositDecision_LOV = DEPOSITDECISION_LOV.filter(value =>
      this._defaultDepositDecision.includes(value.value)
    );
    this._InviteStatus_LOV = INVITESTATUS_LOV.filter(value =>
      this._defaultInviteStatus.includes(value.value)
    );
    this.searchFormGroup.valueChanges.subscribe(() => {
      this.searchPapers();
    });
  }

  /**
   * Triggers the search event with the current form values.
   */
  searchPapers(): void {
    const queryParams = this.getCurrentQueryParams();
    this.search.emit(queryParams);
  }

  /**
   * Gets the current query parameters from the search form.
   *
   * @returns {SearchBoxOutput<ControlConfig>} The current query parameters.
   */
  getCurrentQueryParams(): SearchBoxOutput<ControlConfig> {
    const queryParams = this.searchFormGroup.getRawValue();
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    Object.keys(queryParams).forEach(key => !queryParams[key] && delete queryParams[key]);
    return queryParams as SearchBoxOutput<ControlConfig>;
  }

  /**
   * Sets the current query parameters in the search form.
   *
   * @param queryParams - The query parameters to set.
   */
  setCurrentQueryParams(queryParams: SearchBoxOutput<ControlConfig>): void {
    this.searchFormGroup.reset(undefined, { emitEvent: false });
    this.queryFormControl.reset(undefined, { emitEvent: false });
    this.searchFormGroup.patchValue(queryParams);
    this.searchFormGroup.markAsDirty();
  }
}

/**
 * Type representing the output of the search box with visible controls.
 */
export type SearchBoxOutput<VisibleControls extends ControlConfig> = {
  // @ts-expect-error
  [P in keyof VisibleControls]?: NonNullable<SearchFormRawValue[P]>;
};
