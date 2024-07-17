<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[![pipeline status](https://gitlab.com/orvium/platform/orvium-api/badges/master/pipeline.svg)](https://gitlab.com/orvium/platform/orvium-api/commits/master)
[![coverage report](https://gitlab.com/orvium/platform/orvium-api/badges/master/coverage.svg)](https://gitlab.com/orvium/platform/orvium-api/commits/master)

## Table of Contents
1. [Overview](#1-overview)
   - [Description](#11-description)
   - [Key Features](#12-key-features)
2. [Dependencies](#2-dependencies)
3. [Getting Started](#3-getting-started)
   - [Environment Variables Setup](#31-environment-variables-setup)
   - [Data Storage with S3 Buckets](#32-data-storage-with-s3-buckets)
       - [Creation](#321-creation)
       - [Setting Credentials](#322-setting-credentials)
       - [Access Configuration](#323-access-configuration)
   - [Running MongoDB Locally](#33-running-mongodb-locally)
   - [Running the API](#34-running-the-api)
4. [Advanced Configuration](#4-advance-configuration)
   - [Update MongoDB Docker Image](#41-update-mongodb-docker-image)
   - [Execute Migration Scripts](#42-execute-migration-scripts)
   - [How to Modify the Database Model (DTOs)](#43-how-to-modify-the-database-model-dtos)
   - [SMTP Emails Testing](#44-smtp-emails-testing)
   - [How to Add a New Email Template](#45-how-to-add-a-new-email-template)
5. [Integration with External Services](#5-integration-with-external-services)
   - [Stripe](#51-stripe)
6. [Orvium Agent](#6-orvium-agent)
   - [Personal Token](#61-personal-token)
   - [Login into GitLab Registry](#62-login-into-gitlab-registry)
   - [Solving Issues with Docker Login](#63-solving-issues-with-docker-login)
   - [Create Environment Variables for Docker](#63-create-env-variables)
   - [Run the Agent in Development Mode](#64-run-the-agent-in-development-mode)
   - [Building and Pushing New Versions of Dockerfile-base Image](#65-building-and-pushing-new-versions-of-dockerfile-base-image)


## 1. Overview

### 1.1. Description
This repository contains the source code for both the Orvium API and the file conversion agent. The file conversion agent is tasked with transforming input files (submissions) across various file formats. . The Orvium API offers programmatic access to a comprehensive range of features and functionalities on the Orvium platform, which is tailored for managing scientific journals, communities, conferences, and overseeing the entire lifecycle of scholarly publications and research artifacts. Key capabilities of the Orvium API include:

### 1.2. Key features

- **Publication management:** The API allows users to create, retrieve, update, and delete scholarly publications. Users can manage all the metadata associated with publications, including but not limited to title, authors, abstract, keywords, and publication type.

- **Review management:** The API allows to manage peer reviews of publications. Features include submitting reviews, accepting/rejecting review invitations, and retrieving review information, ect.

- **User management:** Users can authenticate and manage their accounts. Features include user registration, login/logout, profile management, and password reset.
- **Communication:**  Users can communicate internally using chat, this allows a more flexible and efficient communicaiton to help minimising the publication lifecycle friction.

- **Community management:** The API provides endpoints for creating, joining, and managing communities of researchers. Users can browse and search for communities, as well as interact with community members.

- **File management:** API provides support for upload, download, and manage files associated with publications or research artifacts. The API supports various file formats and provides secure storage for uploaded files.

- **Notification system:** Users receive notifications about activity related to their publications, reviews, or community memberships. Admins can manage notification preferences and customise notification templates.

- **Analytics and metrics:** The API offers access to usage analytics and metrics for publications, communities, and users. Developers can retrieve statistical data and insights to analyze platform activity.

- **Integration with external services:** The API supports integration with external services and platforms through webhooks, callbacks, or third-party APIs. Developers can extend the functionality of the Orvium platform by integrating with other tools and systems. Some examples of integrations are:
	- [Stripe](https://stripe.com/): to manage payments within the platform.
	- [iThenticate](https://www.ithenticate.com/): Plagiarism detection.
	- [Oaipmh](https://www.openarchives.org/pmh/): Open Archives Initiative Protocol for Metadata Harvesting
	- [ORCID](https://orcid.org/): Researchers authentication
	- [DOI](https://www.doi.org/): Digital Object Identifiers

- **Security and access control:** The API enforces authentication and authorization mechanisms to ensure secure access to protected resources. Users and developers can manage access permissions and roles to control data access and protect sensitive information.

## 2. Dependencies

Orvium API is based on [Nest](https://github.com/nestjs/nest) framework and has two dependencies to work correctly:

1. [MongoDB](https://www.mongodb.com/): Orvium API uses a MongoDB as a database system to store business data. A local docker container is provided  to run this service, for instance for development purpose.
2. [AWS S3 buckets](https://aws.amazon.com/s3/): API uses AWS to store/retrieve files, suchs a publications, review, images, banners, logos, ect.
3. [OpenAPI Generator](https://openapi-generator.tech/): Allows us to automaticall generate the API client libraries

## 3. Getting Started

### 3.1. Environment variables setup
The api is configured using environment variables stored in a `.env` file that you need to create. You can copy the `.env.template` file in this repository as a template to create it.

```shell
cp .env.template .env
```
The `.env` file needs to be modified to add specific credentials for services such as ethereal email, Google Analytics, etc.

*Please note that some of these services might not be needed for development or even production and could be left in blank or with fake credentials.*

### 3.2. Data storage with S3 Buckets

#### 3.2.1.  Creation  
Orvium API requires two different buckets: 

 - **Public**: This bucket will store files that does not require access control, such as application logos, banners for communities, ect,
 - **Private**: This stores the files that requires access control such as the files belonging to publication, reviews, ect.

For simplicity we recomment to use the following naming convetion for the buckets **[apifiles-environment-appname]** and **[public-apifiles-environment-appname]**. In principal this not mandatory and can be configured in the envoriment variables of the API. However the public repo is required to have the same name of the private one but with the **public-** prefix.

#### 3.2.2. Setting credentials

Execute the following command to configure your aws credentials
```shell
aws configure --profile development
```

Fill the prompt with the development account credentials (ask for the credentials to another developer):
```shell
AWS Access Key ID [None]: AKIA...............
AWS Secret Access Key [None]: aw67zz............
Default region name [None]: eu-central-1
Default output format [None]: json
```
#### 3.2.3. Access configuration
- ** Public Bucket**:
	- Block all public access is OFF
	- Bucket policy
	```shell
	{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::public-apifiles.development.mmmvalley/*"
        }
     ] }
	```
	- Cross-origin resource sharing (CORS) 
	```shell 
	[ {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "DELETE",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    } ]
	```
- **Public Bucket**:  
	-  	Block all public access is ON
	- Cross-origin resource sharing (CORS) 
	```shell 
	[ {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "DELETE",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    } ]
	```
	
### 3.3. Running MongoDB Locally

The first time you need to start a new container using the following command
```
docker run -d -p 27017:27017 --name orvium-mongo -v mongovol:/data/db mongo:7.0.5
```
Now that the container has been created, next time you can start/stop the database use the following commands:
```shell
docker start orvium-mongo
docker stop orvium-mongo
```
### 3.4. Running the API
```shell
nx serve api
```

## 4. Advance Configuration

### 4.1  Update MongoDB docker image

You will need to update your docker images eventually to check that the app runs properly with new versions of mongodb. Before upgrading, you need to check as well the instance featureCompatibilityVersion setting is updated to the current version.

For example, if you are upgrading from MongoDB v4.4 to v5.0, before upgrading you should see featureCompatibilityVersion set to 4.4:

```shell
db.adminCommand( { getParameter: 1, featureCompatibilityVersion: 1 } )
```
The operation should return a result that includes:

```shell
"featureCompatibilityVersion" : { "version" : "4.4" }`
```

Then, follow this procedure to update the docker image and container:
```shell
docker stop orvium-mongo
docker container rm orvium-mongo
docker run -d -p 27017:27017 --name orvium-mongo -v mongovol:/data/db mongo:<new version number>
```

Once the upgrade is sucesfull and the new MongoDB is running, run the setFeatureCompatibilityVersion command against the admin database:

```shell
db.adminCommand( { setFeatureCompatibilityVersion: "5.0" } )`
```

### 4.2.  Execute migration scripts

```bash
npx ts-node scripts/db-migrations/<migration-script>.ts
```

When appliying the scripts to a different environment, you can use dotenv cli together with specific `.env` files:

```shell
dotenv -e .env.staging npx ts-node scripts/db-migrations/2023-Jan-02-update-default-decision.ts 
```

### 4.3. How to modify the Database Model (DTOs)

A Data Transfer Object is an object that is used to encapsulate data, and send it from one subsystem of an application to another. In our case, between the back-end and the UI layer.

To modify the model properly, it is necessary to know that there is a folder containig all the DTOs in the plattform "src/dtos". 

After modifying the desired DTO you can run the following command to generate the lib.
```shell
npm run gen-lib:api
```

### 4.4. SMTP Emails Testing

You can test emails by creating an Ethereal account at https://ethereal.email/create.

Once you have the credentials, you need to store them in your `.env` like this:
```shell
SMTP='{"host":"smtp.ethereal.email","port":587,"auth":{"user":"your-new-user@ethereal.email","pass":"your-pass"}}'
```

*Please note that most emails are sent using the docker container `orvium-agent`. Please check the following sections in order to know how to run it. You can also test emails using the script `email-templates-preview.ts`*.

### 4.5. How to add a new email template

Add the email template in /orvium-api/scripts/email-templates
Example: review-to-draft.hbs

Add the mention to this template wherever it is needed in the code.
Add in /orvium-api/scripts/sync-templates.ts

Execute the following script:
`npx ts-node scripts/sync-templates.ts`

NOTE: Most emails are sent using the docker container `orvium-agent`. Please check the following section in order to know how to run it: ## How to use the job agent using docker

After it, you will be able to check your template as admin user in the ”email templates” section in the app.

## 5. Integration with external Services

### 5.1. Stripe

1. Install (Stripe CLI)[https://stripe.com/docs/stripe-cli] 

2. (optional) Start listening using our webhook. Here, you'll get the STRIPE_WEBHOOK_SECRET for the next step.
```shell
stripe login
stripe listen --forward-connect-to localhost:4200/api/v1/payment/stripe-webhook
```
In case the previous commands do not work, change the first command to the following one, it will ask you to enter the api-key to finish the process.
```shell
stripe login --interactive
```
This command also works
```shell
stripe listen --load-from-webhooks-api --forward-to localhost:4200
```
2. Define the following environment variables with an .env file at the root folder of this solution.
```
STRIPE_KEY=sk_test_5****
STRIPE_WEBHOOK_SECRET=whsec_f****
```

## 6. Orvium Agent 

Please note that the agent should be deployed automatically, but for development purposes, it is recommended to run the agent locally. 

### 6.1. Personal token

The agent operates using a Docker image hosted on GitLab; therefore, the first step is to log in. Initially, you will require a GitLab Personal Access Token (PAT) with the `read_api`, `read_registry`, and `write_registry` scopes. You can create your GitLab PAT at https://gitlab.com/-/profile/personal_access_tokens.

### 6.2. Login into Gitlab registry

Use the following command to login into the gitlab registry. When prompt about the password, use the PAT token created.
```shell
docker login registry.gitlab.com -u <gitlab-username>
```

### 6.3. Solving issues with docker login
Sometimes, you might get the following error when login into the Gitlab registry:
```shell
Error saving credentials: error storing credentials - err: exit status 1, out: `error storing credentials - err: exit status 1, out: `pass not initialized: exit status 1: Error: password store is empty. Try "pass init".
```

You can try to solve it moving the default docker configuration:
```shell
mv ~/.docker/config.json ~/.docker/config.old.json
```

Try to login again and, if it works now, make a copy of the file so you can restore it again next time (we have noticed that 
Docker Desktop in linux sometimes replaces that file with wrong configurations).
```shell
# Use this command to backup you config file when you have logged in successfully
cp ~/.docker/config.json ~/.docker/config.backup.json

# Use this command to restore your backup config file, then login
cp ~/.docker/config.backup.json ~/.docker/config.json
docker login registry.gitlab.com
```

### 6.3. Create env variables

Docker needs environment variables without quotes. You can use this sed command to prepare the env file for docker:
```shell
sed -e "s/'//g" .env > .env.docker
```

NOTE: Some computers might need to specify the mongodb connection using a local ip address instead of `localhost`.
Verify that you env file has the following config:
```
MONGO_URI='mongodb://127.0.0.1/orvium'
```

### 6.4. Run the agent in development mode:
```shell
docker run -it --env-file .env.docker --network=host -v $(pwd)/:/home/nestuser/app:ro -v $HOME/.aws/credentials:/home/nestuser/.aws/credentials:ro --entrypoint /bin/bash registry.gitlab.com/orvium/platform/orvium-api/orvium-agent-base
```
You will be now inside the docker container console. There execute this to run the agent:
```shell
cd app
npm run start:agent
```

### 6.5. Building and pushing new versions of Dockerfile-base image 

If you need to make changes to the `orvium-agent-base` image defined in the `Dockerfile-base` file, then you will need
to build the new image. Normally, this is only necessary when changing/adding programs to process files and images.

```
docker build -t orvium-agent-base -f Dockerfile-base .
docker run -it --env-file .env.docker --network=host -v $(pwd)/:/home/nestuser/app:ro -v $(pwd)/mounted:/tmp/nestApi:ro -v $HOME/.aws/credentials:/home/nestuser/.aws/credentials:ro --entrypoint /bin/bash orvium-agent-base
```

Pushing a new version of this image is now made manually:
```shell
docker build -f Dockerfile-base -t registry.gitlab.com/orvium/platform/orvium-api/orvium-agent-base:1.1.1 .
docker push registry.gitlab.com/orvium/platform/orvium-api/orvium-agent-base:1.1.1
```