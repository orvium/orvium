import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-demo',
  standalone: true,
  templateUrl: './dashboard-demo.component.html',
  styleUrls: ['./dashboard-demo.component.scss'],
  imports: [MatButtonModule, RouterLink],
})
export class DashboardDemoComponent implements OnInit {
  links = [
    { name: 'Access Denied', link: 'access-denied' },
    { name: 'Alert', link: 'alert' },
    { name: 'Benefit', link: 'benefit' },
    { name: 'Community card', link: 'community-card' },
    { name: 'Calendar', link: 'calendar' },
    { name: 'Comment Section', link: 'comment-section' },
    { name: 'Call for papers', link: 'call-for-papers' },
    { name: 'File list', link: 'file-card' },
    { name: 'Spinner', link: 'spinner' },
    { name: 'SearchBar', link: 'searchbar' },
    { name: 'Profile Menu', link: 'profile-menu' },
    { name: 'Review Card', link: 'review-card' },
    { name: 'Predefined Dialogs', link: 'predefined-dialogs' },
    { name: 'Deposit Card', link: 'deposit-card' },
    { name: 'Author list', link: 'author-list' },
    { name: 'Status Info', link: 'status-info' },
    { name: 'Contributor Line', link: 'contributor-line' },
    { name: 'Theme Overview', link: 'theme' },
    { name: 'Table of Contents', link: 'toc' },
    { name: 'Send Notifications', link: 'send-notifications' },
    { name: 'Payment Card', link: 'payment-card' },
    { name: 'Chips', link: 'chips' },
    { name: 'Chat list', link: 'chat-list' },
    { name: 'After submit view', link: 'after-submit' },
  ];

  ngOnInit(): void {
    this.links.sort((a, b) => a.name.localeCompare(b.name));
  }
}
