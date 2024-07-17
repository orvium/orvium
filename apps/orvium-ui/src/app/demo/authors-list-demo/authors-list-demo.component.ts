import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AuthorDTO, CreditType } from '@orvium/api';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { DialogService } from '../../dialogs/dialog.service';
import { AuthorAvatarListComponent } from '../../shared/author-avatar-list/author-avatar-list.component';
import { AuthorsListComponent } from '../../shared/authors-list/authors-list.component';
import { MatCardModule } from '@angular/material/card';
import { factoryAuthorDTO } from '../../shared/test-data';
import { BREAKPOINTS } from '../../layout/breakpoints';

@Component({
  selector: 'app-authors-list-demo',
  standalone: true,
  templateUrl: './authors-list-demo.component.html',
  styleUrls: ['./authors-list-demo.component.scss'],
  imports: [AuthorAvatarListComponent, AuthorsListComponent, MatCardModule],
})
export class AuthorsListDemoComponent implements OnInit {
  smallScreen = false;

  authors: (AuthorDTO & {
    tags?: string[];
    chatLink?: string;
  })[] = [
    factoryAuthorDTO.build({
      credit: [CreditType.Conceptualization, CreditType.FormalAnalysis],
    }),
    factoryAuthorDTO.build(),
    factoryAuthorDTO.build({
      gravatar: '191f906338d89d51b29648c89bb612e7',
      nickname: undefined,
      orcid: undefined,
      institutions: ['Orvium'],
      credit: [
        CreditType.Conceptualization,
        CreditType.FormalAnalysis,
        CreditType.Investigation,
        CreditType.ProjectAdministration,
      ],
    }),
    factoryAuthorDTO.build({
      email: undefined,
      orcid: undefined,
      gravatar: '191f906338d89d51b29648c89bb612e7',
    }),
  ];

  @ViewChild('authorsDialogTemplate') authorsDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('speakersDialogTemplate') speakersDialogTemplate!: TemplateRef<unknown>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    public dialogService: DialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.smallScreen = result.matches;
    });
  }

  openAuthorsList(): void {
    this.dialogService.openCustom({
      title: `Authors (${this.authors.length})`,
      template: this.authorsDialogTemplate,
      showActionButtons: false,
      maxWidth: 500,
    });
  }

  authorClicked(nickname: string): void {
    void this.router.navigate(['profile', nickname]);
    this.dialogService.closeAll();
  }
}
