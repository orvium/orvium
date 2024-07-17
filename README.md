<p align="center">
  <a href="https://orvium.io/" target="blank"><img src="https://s3.eu-central-1.amazonaws.com/public-files.prod.orvium.io/platform/media/logo" width="320" alt="Orvium Logo" /></a>

  <a href="https://orvium.io/" target="blank"><img src="https://orvium.io/img/muak1.f6374cea1a73358d410c0e95c8a567dc.png" alt="Orvium Logo" /></a>
<p align="center">
  
</p>

# Orvium

## Table of content


- [1. Project Overview](#1-project-overview)
  - [1.1 Description](11-description)
  - [1.1 Key Features of Orvium](#11-key-features-of-orvium)
- [2. Orvium Monorepo](#2-orvium-monorepo)
  - [2.1 Introduction](#21-introduction)
  - [2.2 Projects Included](#22-projects-included)
    - [Orvium API](#orvium-api)
    - [Orvium Agent](#orvium-agent)
    - [Orvium UI](#orvium-ui)
- [3. Dependencies](#3-dependencies)
  - [Angular CLI](#angular-cli)
  - [Node.js](#nodejs)
  - [Nx](#nx)
  - [MongoDB](#mongodb)
  - [AWS S3 Buckets](#aws-s3-buckets)
- [4. Getting Started](#4-getting-started)
- [5. Docker compose](#5-docker-compose)

## 1.  Project overview

### 1.1. Description

[Orvium](dapp.orvium.io) is a comprehensive **open-source** platform designed to improve the way scholarly publications are managed, shared, and reviewed. Orvium seeks to introduce transparency, reduce the costs associated with academic publishing, and streamline the process from manuscript submission to publishing, ensuring that authors, institutions, and researchers retain control over their work without delays.

### 1.2. Key Features of Orvium:

**Seamless Review Process:** The platform implements a seamless peer-review process supporting several models such as open peer-review wher reviews are transparent and incentivized, helping to improve the quality and credibility of published research.

**Real-Time Publishing**: Orvium embraces traditional publication models but also goes much beyong than that. Orvium support new models that unlike traditional academic publishing that can take months or years, Orvium allows for immediate publication followed by an open peer-review process, significantly speeding up the dissemination of knowledge.

**Data and Analytics:** Orvium provides researchers and institutions with detailed analytics about their publications' performance, readership, and more, enabling better tracking of impact and engagement.

**Cost-Effective:** By eliminating intermediaries in the publishing process, Orvium reduces the costs associated with publishing and accessing scholarly work, making it more accessible to a global audience.

**Integration with existing systems:** Orvium is designed to work seamlessly with existing institutional repositories and systems, ensuring that universities and research institutions can adopt it without disrupting their current processes.

**Community Governance:** The platform operates under a model of community governance, where decisions are made collectively by its members, ensuring that it operates in the best interests of the academic community.

Orvium's mission is to become the leading open-source platform in managing the lifecycle of scholarly publications through blockchain technology, providing a more efficient, transparent, and accessible system for the global research community.

## 2. Orvium Monorepo

### 2.1. Introduction
All Orvium code lives in a single repository, an architecture generally called a monorepo. The entire Orvium monorepo is built using [Nx](https://nx.dev/).  An extensive and friendly documentation on how to use nx tools can be found on the Nx [getting started guide](https://nx.dev/getting-started) also more concretely on how we use it at Orvium can be consulted in the [Angular section of the guide](https://nx.dev/getting-started/tutorials/angular-standalone-tutorial)

### 2.2. Project included

1. [Orvium API](https://gitlab.com/orvium/platform/orvium-ui/-/blob/monorepo_v1/apps/api/README.md?ref_type=heads) - Orvium API offers programmatic access to a comprehensive range of features and functionalities on the Orvium platform.
2. [Orvium Agent](https://gitlab.com/orvium/platform/orvium-ui/-/blob/monorepo_v1/apps/api/README.md?ref_type=heads) - The file conversion agent is tasked with transforming input files (submissions) across various file formats.
3. [Orvium UI](https://gitlab.com/orvium/platform/orvium-ui/-/blob/monorepo_v1/apps/orvium-ui/README.md?ref_type=heads) - A comprehensive Angular based interface designed for the management of scholarly publications and research artifacts

## 3. Dependencies

1. [Angular CLI](https://v17.angular.io/cli) - The project is based on Angular
2. [Node.js](https://nodejs.org/en) - For cross-platform JavaScript runtime environment
3. [Nx](https://nx.dev/) - For smart monorepo managment
4. [MongoDB](https://www.mongodb.com/): A database system to store business data.
5. [AWS S3 buckets](https://aws.amazon.com/pm/serv-s3/): As a long term storage layer for files persistency
6. [OpenAPI Generator](https://openapi-generator.tech/): Allows us to automaticall generate the API client libraries

## 4. Getting Started

Detailed instruction on how to get started are included in the README files of the different projects included. In short you just need to run [API](https://gitlab.com/orvium/platform/orvium-ui/-/blob/monorepo_v1/apps/api/README.md?ref_type=heads), set and run the [Orvium's Agent](https://gitlab.com/orvium/platform/orvium-ui/-/blob/monorepo_v1/apps/api/README.md?ref_type=heads) and finally you are ready to start the [Orvium UI](https://gitlab.com/orvium/platform/orvium-ui/-/blob/monorepo_v1/apps/orvium-ui/README.md?ref_type=heads)

## 5. Docker compose

To start the docker compose:

```
npm run build
docker-compose build
docker-compose up
```

## 6. Licensing

Orvium code is released and licensed under the [MIT License](http://choosealicense.com/licenses/mit/).

## 7. Contributing

At Orvium, we believe in the community as driven force and therefore welcome your contributions. We aim to make the process as easy and transparent as possible. With that in mind we have created the [Orvium's contribution guide](----) and we invite you to go through.

## 8. Code of Conduct

One of our main objective is to create an enviroment where participating is a harassment-free experience for everyone regardless of our differences. Therefore before participating make sure you have read the [Orvium's code of conduct](-----) and you feel confortable with it. 