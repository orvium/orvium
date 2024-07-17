<p align="center">
  <a href="https://angular.dev/" target="blank"><img src="https://angular.dev/assets/images/press-kit/angular_wordmark_gradient.png" width="320" alt="Angular Logo" /></a>
</p>

# OrviumUI

[![pipeline status](https://gitlab.com/orvium/platform/orvium-ui/badges/master/pipeline.svg)](https://gitlab.com/orvium/platform/orvium-ui/commits/master)
[![coverage report](https://gitlab.com/orvium/platform/orvium-ui/badges/master/coverage.svg)](https://gitlab.com/orvium/platform/orvium-ui/commits/master)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.2.2.

## Table of content

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [Getting Started](#3-getting-started)
   - [Setup Authentication](#31-setup-authentication)
   - [Environment Variables Setup](#31-environment-variables-setup)
   - [Running Orvium-UI](#32-running-orvium-ui)
   - [Creating an Admin User](#33-creating-an-admin-user)
4. [Miscellaneous](#4-miscellaneous)
   - [Code Scaffolding](#41-code-scaffolding)
   - [Breakpoints](#42-breakpoints)
   - [Further Help](#43-further-help)

## 1. Overview

This repository is home to the frontend code that powers the Orvium user interface, a comprehensive Angular based interface designed for the management of scholarly publications and research artifacts. The Orvium User Interface is crafted to provide users with an intuitive and responsive experience, facilitating seamless interaction with the platform's features.

## 2. Dependencies
Orvium UI has the following depencies:

1. [Orvium API](https://www.mongodb.com/): Orvium UI requires the Orvium API that serves as an interface to access, persist the required data and also provide integration with serveral required service such as [Oaipmh](https://www.openarchives.org/pmh/) the Open Archives Initiative Protocol for Metadata Harvesting. [ORCID](https://orcid.org/) for researchers authentication
or [DOI services](https://www.doi.org/) that provices Digital Object Identifiers, among others.

## 3. Getting started

### 3.1. Setup authentication

Log in to GitLab and navigate to **Profile > Preferences > Access Tokens**. Generate a personal access token with the following scopes:
- `read_api`
- `read_registry` 

### 3.1. Environment variables setup
Orvium UI is configured using environment variables stored in a `.env` file that you need to create. You can copy the `.env.template` file in this repository as a template to create it.

```shell
cp .env.template .env
```
The `.env` file needs to be modified to add specific credentials for required services.

*Please note that some of these services might not be needed for development or even production and could be left in blank or with fake credentials.*

### 3.2. Running Orvium-UI

Run the following command to launch the develpment server
```shell
nx serve orvium-ui
```

Right after that navigate to `http://localhost:4200/` to access Orvium-UI. The app is configured to automatically reload if you perform any change on the source files.

*Please note that web3 beta uses Python v2.7 to compile, remember to have the library accessible from your command line*

### 3.3. Creating an Admin User

To perform certain administrative operations within our system, an admin user account is required. Admin users have enhanced permissions that allow them to manage key aspects of the application.

1. **Access the Database**:
Access your database management tool. This will vary depending on the specific database technology you are using (e.g., [MongoDB Compass](https://www.mongodb.com/products/tools/compass) for MongoDB databases).

2. **Navigate to the Profile Collection**:
   Locate the `profile` collection within your database. This collection stores user profile information, including roles.

3. **Add Admin Role**:
   To create an admin user, you need to modify the user's roles list in the `profile` collection. Find the user's profile entry and add `"admin"` to the roles array in the user's profile document. Here is an example of what the modified document might look like:

   ```json
   {
     "username": "your_username",
     "roles": ["admin"]
   }

4. **Save Changes**:
Ensure that you save the changes to the database. This update will grant the user admin privileges.

5. **Verify Admin Access**:
Have the user log in to Orvium to verify that they now have admin access. They should be able to perform administrative tasks such as accessing restricted areas of the application.

*Important Note:
Creating an admin user grants significant access and control over your application. It is crucial to manage these permissions carefully to maintain the security and integrity of the Orvium platform.*

## 4. Miscelaneous

### 4.1. Code scaffolding

To generate a new component  run
```shell
ng generate component component-name
```

In addition to component generation you can also use the following commands depending on the action you would like to perform
```shell
ng generate directive|pipe|service|class|guard|interface|enum|module.
```

### 4.2. Breakpoints

To determine the breakpoints at which the display changes with responsive UI, we will choose the values from [The Material Design Documentation](https://material.io/archive/guidelines/layout/responsive-ui.html#responsive-ui-breakpoints).

- *small screens* we will check with the BreakpointObserver the breakpoints **XSmall** and **Small** (max-width: 960px).

- *mobile screens exclusively* we will check with the BreakpointObserver the breakpoint **XSmall** (max-width: 600px).

- *tablet screens exclusively* we will check with the BreakpointObserver the breakpoint **Tablet** (max-width: 1280px).

### 4.3. Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

