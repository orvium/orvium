import { Ui } from 'tinymce';
import {
  emailCommonVariables,
  emailCommunityVariables,
  emailEditorMessageVariables,
  emailInvitationVariables,
  emailPublicationVariables,
  emailReviewVariables,
  emailUserVariables,
  EmailVariables,
} from '@orvium/api';

/**
 * Prepares an array of email variable details to be displayed in UI tables.
 */
function prepareTinyVariables(emailPublicationVariables: EmailVariables<unknown>): string[][] {
  const array: string[][] = [];
  for (const key in emailPublicationVariables) {
    // @ts-expect-error key always exists in the variable
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const variable = emailPublicationVariables[key] as { name: string; description: string };
    array.push([variable.name, `{{${key}}}`, variable.description]);
  }
  return array;
}

/**
 * Data structure representing the configuration for a dynamic variables dialog. This dialog utilizes tabs
 * to categorize variables based on different contexts such as Community, Publication, Review, etc.
 */
export const dynamicVariablesDialogData: Ui.Dialog.TabSpec[] = [
  // array of tab panel specifications
  {
    name: 'tab0',
    title: 'Community',
    items: [
      {
        type: 'htmlpanel',
        html: `
        <p>In this panel you can see the avaiable email variables for each email, if you copy one of them in your email it will be replaced by the corresponding value when you send it.</p>
        <p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p>
        <p>In the editor you will see the title of the dynamic variables.</p>
        <p>You can press the &quot;Send a test email" button to receive an email with the content of the email variables</p><br>`,
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailCommunityVariables),
      },
    ],
  },
  {
    name: 'tab1',
    title: 'Publication',
    items: [
      {
        type: 'htmlpanel',
        html: `
              <p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p>
              <p>Below are the variables related to the content of the publications </p><br>`,
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailPublicationVariables),
      },
    ],
  },
  {
    name: 'tab2',
    title: 'Review',
    items: [
      {
        type: 'htmlpanel',
        html: '<p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p><br>',
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailReviewVariables),
      },
    ],
  },
  {
    name: 'tab3',
    title: 'User',
    items: [
      {
        type: 'htmlpanel',
        html: '<p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p><br>',
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailUserVariables),
      },
    ],
  },
  {
    name: 'tab4',
    title: 'Invitation',
    items: [
      {
        type: 'htmlpanel',
        html: '<p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p><br>',
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailInvitationVariables),
      },
    ],
  },
  {
    name: 'tab5',
    title: 'Common',
    items: [
      {
        type: 'htmlpanel',
        html: '<p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p><br>',
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailCommonVariables),
      },
    ],
  },
  {
    name: 'tab6',
    title: 'Editorial',
    items: [
      {
        type: 'htmlpanel',
        html: '<p>Please copy the text of the dynamic variable and paste it where you want it to appear in the email content.</p><br>',
      },
      {
        type: 'table',
        header: ['Name', 'Dynamic variable', 'Description'],
        cells: prepareTinyVariables(emailEditorMessageVariables),
      },
    ],
  },
];
