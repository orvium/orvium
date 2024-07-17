export function generateOpenaireResponse(depositId: string): unknown {
  return {
    meta: {
      status: 'success',
      code: '200',
      query: '(*) sortBy resultdateofacceptance/sort.descending',
      filters: [
        'collectedfromdatasourceid exact "opendoar____::f00e1df0c9e961695bd1c1d9816d0c04"or resulthostingdatasourceid exact "opendoar____::f00e1df0c9e961695bd1c1d9816d0c04"',
        'oaftype exact result',
        'resulttypeid exact publication',
        'deletedbyinference=false',
      ],
      total: '2',
      page: '0',
      size: '10000',
      _links: {
        first: {
          href: 'http://services.openaire.eu/search/rest/v2/api/publications?page=0&size=10000',
        },
        last: {
          href: 'http://services.openaire.eu/search/rest/v2/api/publications?page=0&size=10000',
        },
        previous: {
          href: 'http://services.openaire.eu/search/rest/v2/api/publications?page=0&size=10000',
        },
        next: {
          href: 'http://services.openaire.eu/search/rest/v2/api/publications?page=0&size=10000',
        },
        self: {
          href: 'http://services.openaire.eu/search/rest/v2/api/publications?page=0&size=10000',
        },
      },
    },
    results: [
      {
        result: {
          metadata: {
            'oaf:entity': {
              'oaf:result': {
                country: {
                  classid: 'FR',
                  classname: 'France',
                  schemename: 'dnet:countries',
                  schemeid: 'dnet:countries',
                },
                creator: [
                  {
                    surname: 'Coëtlogon',
                    name: 'Perrine',
                    rank: 1,
                    content: 'de Coëtlogon, Perrine',
                  },
                  {
                    surname: 'Durand',
                    name: 'Marc',
                    rank: 2,
                    content: 'Durand, Marc',
                  },
                  {
                    surname: 'Jeantet',
                    name: 'Maxime',
                    rank: 3,
                    content: 'Jeantet, Maxime',
                  },
                  {
                    surname: 'Génin',
                    name: 'Claire',
                    rank: 4,
                    content: 'Génin, Claire',
                  },
                  {
                    surname: 'Ramon',
                    name: 'Romuald',
                    rank: 5,
                    content: 'Ramon, Romuald',
                  },
                  {
                    surname: 'Boulet',
                    name: 'Pierre',
                    rank: 6,
                    content: 'Boulet, Pierre',
                  },
                ],
                bestaccessright: {
                  classid: 'OPEN',
                  classname: 'Open Access',
                  schemename: 'dnet:access_modes',
                  schemeid: 'dnet:access_modes',
                },
                dateofacceptance: '2021-06-30',
                subject: [
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content:
                      '[INFO.INFO-DC]Computer Science [cs]/Distributed, Parallel, and Cluster Computing [cs.DC]',
                  },
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: '[SHS.SCIPO]Humanities and Social Sciences/Political science',
                  },
                ],
                collectedfrom: [
                  {
                    name: 'Hyper Article en Ligne',
                    id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                  },
                  {
                    name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                    id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                  },
                  {
                    name: 'Orvium',
                    id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                  },
                  {
                    name: 'HAL - Université de Lille',
                    id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                  },
                  {
                    name: 'Hal-Diderot',
                    id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                  },
                  {
                    name: "Mémoires en Sciences de l'Information et de la Communication",
                    id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                  },
                ],
                description:
                  "Les technologies blockchain combinent des innovations à des solutions informatiques existantes sur des systèmes informatiques distribués. Elles modifient de façon décisive la façon dont les organisations, même concurrentes, émettent et transfèrent en confiance des données ou des actifs numériques1 , sans passer par une structure centrale de contrôle. Il peut sembler paradoxal de réfléchir aux applications de la blockchain dans le secteur public, alors que son origine, au travers de l\u2019apparition du bitcoin, avait un objectif précis : désintermédier des institutions étatiques et des tiers de confiance dans les fonctions régaliennes de l\u2019émission de la monnaie et du suivi des transactions financières et de leur enregistrement. Si cette antinomie est historiquement légitime, les objectifs de ce document sont d\u2019expliquer pourquoi il convient de distinguer la philosophie originelle de la blockchain de sa capacité fonctionnelle, de montrer comment depuis plusieurs années elle a fortement évolué et a su démontrer sa compatibilité avec un environnement réglementé et sa maturité technologique. D'ailleurs aujourd\u2019hui, vouloir parler de « LA » blockchain2 est un exercice vain. Elle se décline désormais sous différentes formes avec des caractéristiques communes (distribution, registre, transparence, traçabilité, immutabilité, sécurité) mais aussi des différences significatives quant aux méthodes de gouvernance, d\u2019authentification des acteurs et de confidentialité des transactions. L\u2019enjeu de ce document est de montrer que le secteur public peut bénéficier des caractéristiques uniques offertes par les technologies blockchain, tout en respectant ses valeurs et en offrant une meilleure expérience et une confiance renforcée à l\u2019usager du service public français et européen.",
                language: {
                  classid: 'fra/fre',
                  classname: 'French',
                  schemename: 'dnet:languages',
                  schemeid: 'dnet:languages',
                },
                source: [
                  2021,
                  'https://hal.archives-ouvertes.fr/hal-03232816',
                  '[Rapport de recherche] Université de Lille (2018-..). 2021',
                ],
                title: {
                  trust: 0.9,
                  classid: 'main title',
                  provenanceaction: 'sysimport:crosswalk:repository',
                  classname: 'main title',
                  schemename: 'dnet:dataCite_title',
                  inferred: false,
                  schemeid: 'dnet:dataCite_title',
                  content: 'Les technologies blockchain au service du secteur public',
                },
                resourcetype: {
                  classid: 'UNKNOWN',
                  classname: 'UNKNOWN',
                  schemename: 'dnet:dataCite_resource',
                  schemeid: 'dnet:dataCite_resource',
                },
                resulttype: {
                  classid: 'publication',
                  classname: 'publication',
                  schemename: 'dnet:result_typologies',
                  schemeid: 'dnet:result_typologies',
                },
                rels: {
                  rel: [
                    {
                      trust: 0.85,
                      country: {
                        classid: 'FR',
                        classname: 'France',
                        schemename: 'dnet:countries',
                        schemeid: 'dnet:countries',
                      },
                      provenanceaction: 'result:organization:instrepo',
                      inferenceprovenance: 'propagation',
                      legalname: 'Université Paris Diderot',
                      legalshortname: 'Université Paris Diderot',
                      inferred: true,
                      to: {
                        scheme: 'dnet:result_organization_relations',
                        type: 'organization',
                        class: 'hasAuthorInstitution',
                        content: 'openorgs____::c80a8243a5e5c620d7931c88d93bf17a',
                      },
                    },
                    {
                      trust: 0.85,
                      country: {
                        classid: 'FR',
                        classname: 'France',
                        schemename: 'dnet:countries',
                        schemeid: 'dnet:countries',
                      },
                      provenanceaction: 'result:organization:instrepo',
                      inferenceprovenance: 'propagation',
                      legalname: 'University of Lille',
                      legalshortname: 'USTL',
                      inferred: true,
                      to: {
                        scheme: 'dnet:result_organization_relations',
                        type: 'organization',
                        class: 'hasAuthorInstitution',
                        content: 'openorgs____::a7d9dc62bc79f067b8c0f3f683320ab6',
                      },
                    },
                  ],
                },
                contributor: [
                  'Centre de Recherche en Informatique, Signal et Automatique de Lille - UMR 9189 (CRIStAL) ; Ecole Centrale de Lille-Université de Lille-Centre National de la Recherche Scientifique (CNRS)',
                  'Centre de Recherche en Informatique, Signal et Automatique de Lille - UMR 9189 (CRIStAL) ; Université de Lille-Ecole Centrale de Lille-Centre National de la Recherche Scientifique (CNRS)',
                  'Université de Lille (2018-....)',
                ],
                relevantdate: {
                  trust: 0.9,
                  classid: 'UNKNOWN',
                  provenanceaction: 'sysimport:crosswalk:datasetarchive',
                  classname: 'UNKNOWN',
                  schemename: 'dnet:dataCite_date',
                  inferred: false,
                  schemeid: 'dnet:dataCite_date',
                  content: '2021-06-23',
                },
                datainfo: {
                  trust: 0.8,
                  provenanceaction: {
                    classid: 'sysimport:dedup',
                    classname: 'Inferred by OpenAIRE',
                    schemename: 'dnet:provenanceActions',
                    schemeid: 'dnet:provenanceActions',
                  },
                  inferenceprovenance: 'dedup-similarity-result-decisiontree-v2',
                  inferred: true,
                  deletedbyinference: false,
                },
                children: {
                  result: [
                    {
                      collectedfrom: {
                        name: 'Orvium',
                        id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                      },
                      objidentifier: 'od______9944::c93754394cd69bfb1653b85af3cb30fb',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:datasetarchive',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-05-22',
                      collectedfrom: {
                        name: "Mémoires en Sciences de l'Information et de la Communication",
                        id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od_______212::47f0f6ded91c07e358c9026370e82035',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-05-22',
                      collectedfrom: {
                        name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                        id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od_______177::47f0f6ded91c07e358c9026370e82035',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-06-30',
                      collectedfrom: {
                        name: "Mémoires en Sciences de l'Information et de la Communication",
                        id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od_______212::685be0253a93af37501a36efe28dde14',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-06-30',
                      collectedfrom: {
                        name: 'Hyper Article en Ligne',
                        id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od_______166::685be0253a93af37501a36efe28dde14',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-06-30',
                      collectedfrom: {
                        name: 'Hal-Diderot',
                        id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od______2592::685be0253a93af37501a36efe28dde14',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-05-22',
                      collectedfrom: {
                        name: 'Hal-Diderot',
                        id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od______2592::47f0f6ded91c07e358c9026370e82035',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-05-22',
                      collectedfrom: {
                        name: 'Hyper Article en Ligne',
                        id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od_______166::47f0f6ded91c07e358c9026370e82035',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-05-22',
                      collectedfrom: {
                        name: 'HAL - Université de Lille',
                        id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od______4254::47f0f6ded91c07e358c9026370e82035',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-06-30',
                      collectedfrom: {
                        name: 'HAL - Université de Lille',
                        id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od______4254::685be0253a93af37501a36efe28dde14',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                    {
                      dateofacceptance: '2021-06-30',
                      collectedfrom: {
                        name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                        id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                      },
                      publisher: 'HAL CCSD',
                      objidentifier: 'od_______177::685be0253a93af37501a36efe28dde14',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content: 'Les technologies blockchain au service du secteur public',
                      },
                    },
                  ],
                  instance: [
                    {
                      hostedby: {
                        name: 'Hyper Article en Ligne',
                        id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                      },
                      dateofacceptance: '2021-05-22',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/file/2021-univlille-la-blockchain-secteur-public_v1.0.0%20%282%29.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'Hyper Article en Ligne',
                        id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                      },
                      instancetype: {
                        classid: '0016',
                        classname: 'Preprint',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0002',
                        classname: 'nonPeerReviewed',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                    },
                    {
                      hostedby: {
                        name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                        id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                      },
                      dateofacceptance: '2021-06-30',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/file/2021-univlille-la-blockchain-secteur-public_v1.0.1.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                        id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                      },
                      instancetype: {
                        classid: '0017',
                        classname: 'Report',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                    },
                    {
                      hostedby: {
                        name: 'Orvium',
                        id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                      },
                      webresource: {
                        url: `https://dapp.orvium.io/deposits/${depositId}/view`,
                      },
                      accessright: {
                        classid: 'OPEN',
                        classname: 'Open Access',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'Orvium',
                        id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                      },
                      instancetype: {
                        classid: '0001',
                        classname: 'Article',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                    },
                    {
                      hostedby: {
                        name: 'HAL - Université de Lille',
                        id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                      },
                      dateofacceptance: '2021-05-22',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/file/2021-univlille-la-blockchain-secteur-public_v1.0.0%20%282%29.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'HAL - Université de Lille',
                        id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                      },
                      instancetype: {
                        classid: '0016',
                        classname: 'Preprint',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0002',
                        classname: 'nonPeerReviewed',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                    },
                    {
                      hostedby: {
                        name: 'Hal-Diderot',
                        id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                      },
                      dateofacceptance: '2021-05-22',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/file/2021-univlille-la-blockchain-secteur-public_v1.0.0%20%282%29.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'Hal-Diderot',
                        id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                      },
                      instancetype: {
                        classid: '0016',
                        classname: 'Preprint',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0002',
                        classname: 'nonPeerReviewed',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                    },
                    {
                      hostedby: {
                        name: 'Hyper Article en Ligne',
                        id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                      },
                      dateofacceptance: '2021-06-30',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/file/2021-univlille-la-blockchain-secteur-public_v1.0.1.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'Hyper Article en Ligne',
                        id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                      },
                      instancetype: {
                        classid: '0017',
                        classname: 'Report',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::7e7757b1e12abcb736ab9a754ffb617a',
                    },
                    {
                      hostedby: {
                        name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                        id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                      },
                      dateofacceptance: '2021-05-22',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/file/2021-univlille-la-blockchain-secteur-public_v1.0.0%20%282%29.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: "Hyper Article en Ligne - Sciences de l'Homme et de la Société",
                        id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                      },
                      instancetype: {
                        classid: '0016',
                        classname: 'Preprint',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0002',
                        classname: 'nonPeerReviewed',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::96da2f590cd7246bbde0051047b0d6f7',
                    },
                    {
                      hostedby: {
                        name: 'Hal-Diderot',
                        id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                      },
                      dateofacceptance: '2021-06-30',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/file/2021-univlille-la-blockchain-secteur-public_v1.0.1.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'Hal-Diderot',
                        id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                      },
                      instancetype: {
                        classid: '0017',
                        classname: 'Report',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::18bb68e2b38e4a8ce7cf4f6b2625768c',
                    },
                    {
                      hostedby: {
                        name: "Mémoires en Sciences de l'Information et de la Communication",
                        id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                      },
                      dateofacceptance: '2021-06-30',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/file/2021-univlille-la-blockchain-secteur-public_v1.0.1.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: "Mémoires en Sciences de l'Information et de la Communication",
                        id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                      },
                      instancetype: {
                        classid: '0017',
                        classname: 'Report',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                    },
                    {
                      hostedby: {
                        name: "Mémoires en Sciences de l'Information et de la Communication",
                        id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                      },
                      dateofacceptance: '2021-05-22',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816/file/2021-univlille-la-blockchain-secteur-public_v1.0.0%20%282%29.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: "Mémoires en Sciences de l'Information et de la Communication",
                        id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                      },
                      instancetype: {
                        classid: '0016',
                        classname: 'Preprint',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0002',
                        classname: 'nonPeerReviewed',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::1534b76d325a8f591b52d302e7181331',
                    },
                    {
                      hostedby: {
                        name: 'HAL - Université de Lille',
                        id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                      },
                      dateofacceptance: '2021-06-30',
                      webresource: [
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/document',
                        },
                        {
                          url: 'https://hal.archives-ouvertes.fr/hal-03232816v2/file/2021-univlille-la-blockchain-secteur-public_v1.0.1.pdf',
                        },
                      ],
                      accessright: {
                        classid: 'UNKNOWN',
                        classname: 'not available',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'HAL - Université de Lille',
                        id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                      },
                      instancetype: {
                        classid: '0017',
                        classname: 'Report',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'hal',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'HAL /  Hyper Article en Ligne identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: 'hal-03232816',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::29c0c0ee223856f336d7ea8052057753',
                    },
                  ],
                },
                publisher: 'HAL CCSD',
                originalId: [
                  '50|od_______166::47f0f6ded91c07e358c9026370e82035',
                  'oai:HAL:hal-03232816v1',
                  'oai:HAL:hal-03232816v2',
                  '50|od_______177::685be0253a93af37501a36efe28dde14',
                  `oai:orvium.io:${depositId}`,
                  '50|od______9944::c93754394cd69bfb1653b85af3cb30fb',
                  '50|od______4254::47f0f6ded91c07e358c9026370e82035',
                  '50|od______2592::47f0f6ded91c07e358c9026370e82035',
                  '50|od_______166::685be0253a93af37501a36efe28dde14',
                  '50|od_______177::47f0f6ded91c07e358c9026370e82035',
                  '50|od______2592::685be0253a93af37501a36efe28dde14',
                  '50|od_______212::685be0253a93af37501a36efe28dde14',
                  '50|od_______212::47f0f6ded91c07e358c9026370e82035',
                  '50|od______4254::685be0253a93af37501a36efe28dde14',
                ],
              },
              'xsi:schemaLocation':
                'http://namespace.openaire.eu/oaf https://www.openaire.eu/schema/1.0/oaf-1.0.xsd',
              'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
              'xmlns:oaf': 'http://namespace.openaire.eu/oaf',
            },
          },
          'xmlns:dri': 'http://www.driver-repository.eu/namespace/dri',
          header: {
            'dri:dateOfCollection': '2021-05-30T08:37:22.861Z',
            'dri:dateOfTransformation': '2021-08-16T21:18:41.452Z',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'dri:objIdentifier': 'dedup_wf_001::c93754394cd69bfb1653b85af3cb30fb',
          },
        },
      },
      {
        result: {
          metadata: {
            'oaf:entity': {
              'oaf:result': {
                country: {
                  classid: 'NL',
                  classname: 'Atlantis',
                  schemename: 'dnet:countries',
                  schemeid: 'dnet:countries',
                },
                creator: [
                  {
                    rank: 1,
                    content: 'Maria Paula Giulianetti de Almeida',
                  },
                  {
                    rank: 2,
                    content: 'Gustavo Mockaitis',
                  },
                  {
                    surname: 'Weissbrodt',
                    name: 'David G.',
                    rank: 3,
                    content: 'David G. Weissbrodt',
                  },
                ],
                bestaccessright: {
                  classid: 'OPEN',
                  classname: 'Open Access',
                  schemename: 'dnet:access_modes',
                  schemeid: 'dnet:access_modes',
                },
                dateofacceptance: '2021-01-07',
                subject: [
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: 'cheese whey',
                  },
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: 'environmental impacts',
                  },
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: 'resource valorisation',
                  },
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: 'laws and regulations',
                  },
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: 'information access',
                  },
                  {
                    trust: 0.9,
                    classid: 'keyword',
                    provenanceaction: 'sysimport:crosswalk:repository',
                    classname: 'keyword',
                    schemename: 'dnet:subject_classification_typologies',
                    inferred: false,
                    schemeid: 'dnet:subject_classification_typologies',
                    content: 'anaerobic and microalgal processes',
                  },
                ],
                collectedfrom: [
                  {
                    name: 'NARCIS',
                    id: 'openaire____::fdb035c8b3e0540a8d9a561a6c44f4de',
                  },
                  {
                    name: 'NARCIS',
                    id: 'eurocrisdris::fe4903425d9040f680d8610d9079ea14',
                  },
                  {
                    name: 'Orvium',
                    id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                  },
                ],
                format: 'application/pdf',
                description:
                  'Milk discovery and processing enabled human settling and thriving in various settings. The discovery of cheese led to the production of whey as dairy by-product. Although it can find application in food, beverages, personal care products, pharmaceuticals and medical treatment, cheese whey is a massive dairying residue world-wide (154 Mm3·y-1) with high organic and nutrient loads. About 42% is used as low-value products as animal feed and fertilisers or even directly discharged in water streams, leading to ecosystem damage by eutrophication. Recycling and repurposing whey remains a challenge for remote locations and poor communities with limited access to expensive technology. Anaerobic digestion is proven and accessible for utilizing whey as substrate to produce biogas and/or carboxylates. Alternative processes combining anaerobic digestion and low-cost open photobioprocesses can foster the valorisation of cheese whey and capture of organics and nitrogen and phosphorus nutrients into a microalgal biomass that can be used as food and crop supply or processed into biofuels, pigments, antioxi-dants, among other value-added products. Awareness should be raised about the economic potential of cheese whey surplus by developing an action plan that (i) identifies stakeholders, (ii) sets goals and achieves solutions, (iii) decreases technology gaps among countries, (iv) enforces legislation and compliance, and (v) creates subsidies and foments partnerships with industries and other countries for the full valorisation of whey. We propose a closed-loop biorefinery implementation strategy to simultaneously mitigate environmental impacts and valorise whey resources.',
                language: {
                  classid: 'eng',
                  classname: 'English',
                  schemename: 'dnet:languages',
                  schemeid: 'dnet:languages',
                },
                source: ['The Evolving Scholar', 'TITLE=The Evolving Scholar'],
                title: {
                  trust: 0.9,
                  classid: 'main title',
                  provenanceaction: 'sysimport:crosswalk:repository',
                  classname: 'main title',
                  schemename: 'dnet:dataCite_title',
                  inferred: false,
                  schemeid: 'dnet:dataCite_title',
                  content:
                    'Got Whey? The significance of cheese whey at the confluence of dairying, environmental impacts, energy and resource biorecovery',
                },
                resourcetype: {
                  classid: 'journal article',
                  classname: 'journal article',
                  schemename: 'dnet:dataCite_resource',
                  schemeid: 'dnet:dataCite_resource',
                },
                resulttype: {
                  classid: 'publication',
                  classname: 'publication',
                  schemename: 'dnet:result_typologies',
                  schemeid: 'dnet:result_typologies',
                },
                rels: {
                  rel: {
                    trust: 0.85,
                    country: {
                      classid: 'NL',
                      classname: 'Atlantis',
                      schemename: 'dnet:countries',
                      schemeid: 'dnet:countries',
                    },
                    provenanceaction: 'result:organization:instrepo',
                    inferenceprovenance: 'propagation',
                    legalname: 'Technische Universiteit HW (HW University of Technology)',
                    legalshortname: 'TU HW',
                    inferred: true,
                    to: {
                      scheme: 'dnet:result_organization_relations',
                      type: 'organization',
                      class: 'hasAuthorInstitution',
                      content: 'pending_org_::e246eb29c43b179a6bd19b83755ddb53',
                    },
                  },
                },
                relevantdate: [
                  {
                    trust: 0.9,
                    classid: 'issued',
                    provenanceaction: 'sysimport:crosswalk:datasetarchive',
                    classname: 'issued',
                    schemename: 'dnet:dataCite_date',
                    inferred: false,
                    schemeid: 'dnet:dataCite_date',
                    content: '2021-01-07',
                  },
                  {
                    trust: 0.9,
                    classid: 'UNKNOWN',
                    provenanceaction: 'sysimport:crosswalk:datasetarchive',
                    classname: 'UNKNOWN',
                    schemename: 'dnet:dataCite_date',
                    inferred: false,
                    schemeid: 'dnet:dataCite_date',
                    content: '2020-12-18',
                  },
                ],
                datainfo: {
                  trust: 0.8,
                  provenanceaction: {
                    classid: 'sysimport:dedup',
                    classname: 'Inferred by OpenAIRE',
                    schemename: 'dnet:provenanceActions',
                    schemeid: 'dnet:provenanceActions',
                  },
                  inferenceprovenance: 'dedup-similarity-result-decisiontree-v2',
                  inferred: true,
                  deletedbyinference: false,
                },
                children: {
                  result: [
                    {
                      dateofacceptance: '2021-01-07',
                      collectedfrom: {
                        name: 'NARCIS',
                        id: 'openaire____::fdb035c8b3e0540a8d9a561a6c44f4de',
                      },
                      objidentifier: 'narcis______::047a4af13eec11f65909c039ebfef51f',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content:
                          'Got Whey? The significance of cheese whey at the confluence of dairying, environmental impacts, energy and resource biorecovery',
                      },
                    },
                    {
                      dateofacceptance: '2021-01-07',
                      collectedfrom: {
                        name: 'NARCIS',
                        id: 'eurocrisdris::fe4903425d9040f680d8610d9079ea14',
                      },
                      objidentifier: 'dris___00893::fbe45ca274a0ea922d5d96fc7f4878ba',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:datasetarchive',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content:
                          'Got Whey? The significance of cheese whey at the confluence of dairying, environmental impacts, energy and resource biorecovery',
                      },
                    },
                    {
                      collectedfrom: {
                        name: 'Orvium',
                        id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                      },
                      objidentifier: 'od______9944::77cf0e5914ed474475d6cefa7d4abffe',
                      title: {
                        trust: 0.9,
                        classid: 'main title',
                        provenanceaction: 'sysimport:crosswalk:datasetarchive',
                        classname: 'main title',
                        schemename: 'dnet:dataCite_title',
                        inferred: false,
                        schemeid: 'dnet:dataCite_title',
                        content:
                          'Got Whey? The significance of cheese whey at the confluence of dairying, environmental impacts, energy and resource biorecovery',
                      },
                    },
                  ],
                  instance: [
                    {
                      hostedby: {
                        name: 'TU HW Repository',
                        id: 'opendoar____::c9892a989183de32e976c6f04e700201',
                      },
                      dateofacceptance: '2021-01-07',
                      webresource: {
                        url: 'http://resolver.example.com/uuid:301b20e4-165a-4bee-9a87-afb7019008da',
                      },
                      accessright: {
                        classid: 'OPEN',
                        classname: 'Open Access',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'NARCIS',
                        id: 'openaire____::fdb035c8b3e0540a8d9a561a6c44f4de',
                      },
                      instancetype: {
                        classid: '0001',
                        classname: 'Article',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: {
                        trust: 0.9,
                        classid: 'doi',
                        provenanceaction: 'sysimport:crosswalk:repository',
                        classname: 'Digital Object Identifier',
                        schemename: 'dnet:pid_types',
                        inferred: false,
                        schemeid: 'dnet:pid_types',
                        content: '10.24404/5fdd3c22eaf7860008874c47',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::c9892a989183de32e976c6f04e700201',
                    },
                    {
                      hostedby: {
                        name: 'NARCIS',
                        id: 'eurocrisdris::fe4903425d9040f680d8610d9079ea14',
                      },
                      dateofacceptance: '2021-01-07',
                      webresource: [
                        {
                          url: 'http://resolver.example.com/uuid:301b20e4-165a-4bee-9a87-afb7019008da',
                        },
                        {
                          url: 'http://dx.doi.org/10.24404/5fdd3c22eaf7860008874c47',
                        },
                      ],
                      accessright: {
                        classid: 'OPEN',
                        classname: 'Open Access',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'NARCIS',
                        id: 'eurocrisdris::fe4903425d9040f680d8610d9079ea14',
                      },
                      instancetype: {
                        classid: '0001',
                        classname: 'Article',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      alternateidentifier: [
                        {
                          trust: 0.9,
                          classid: 'urn',
                          provenanceaction: 'sysimport:crosswalk:datasetarchive',
                          classname: 'urn',
                          schemename: 'dnet:pid_types',
                          inferred: false,
                          schemeid: 'dnet:pid_types',
                          content: 'urn:NBN:nl:ui:24-uuid:301b20e4-165a-4bee-9a87-afb7019008da',
                        },
                        {
                          trust: 0.9,
                          classid: 'doi',
                          provenanceaction: 'sysimport:crosswalk:datasetarchive',
                          classname: 'Digital Object Identifier',
                          schemename: 'dnet:pid_types',
                          inferred: false,
                          schemeid: 'dnet:pid_types',
                          content: '10.24404/5fdd3c22eaf7860008874c47',
                        },
                      ],
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'eurocrisdris::fe4903425d9040f680d8610d9079ea14',
                    },
                    {
                      hostedby: {
                        name: 'Orvium',
                        id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                      },
                      webresource: {
                        url: 'https://dapp.orvium.io/deposits/5fdd3c22eaf7860008874c47/view',
                      },
                      accessright: {
                        classid: 'OPEN',
                        classname: 'Open Access',
                        schemename: 'dnet:access_modes',
                        schemeid: 'dnet:access_modes',
                      },
                      collectedfrom: {
                        name: 'Orvium',
                        id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                      },
                      instancetype: {
                        classid: '0001',
                        classname: 'Article',
                        schemename: 'dnet:publication_resource',
                        schemeid: 'dnet:publication_resource',
                      },
                      refereed: {
                        classid: '0000',
                        classname: 'UNKNOWN',
                        schemename: 'dnet:review_levels',
                        schemeid: 'dnet:review_levels',
                      },
                      id: 'opendoar____::f00e1df0c9e961695bd1c1d9816d0c04',
                    },
                  ],
                },
                originalId: [
                  '50|narcis______::047a4af13eec11f65909c039ebfef51f',
                  'tud:oai:example.com:uuid:301b20e4-165a-4bee-9a87-afb7019008da',
                  '50|dris___00893::fbe45ca274a0ea922d5d96fc7f4878ba',
                  'oai:services.nod.dans.knaw.nl:Publications/tud:oai:example.com:uuid:301b20e4-165a-4bee-9a87-afb7019008da',
                  'oai:orvium.io:5fdd3c22eaf7860008874c47',
                  '50|od______9944::77cf0e5914ed474475d6cefa7d4abffe',
                ],
              },
              'xsi:schemaLocation':
                'http://namespace.openaire.eu/oaf https://www.openaire.eu/schema/1.0/oaf-1.0.xsd',
              'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
              'xmlns:oaf': 'http://namespace.openaire.eu/oaf',
            },
          },
          'xmlns:dri': 'http://www.driver-repository.eu/namespace/dri',
          header: {
            'dri:dateOfCollection': '2021-08-17T08:59:02.344Z',
            'dri:dateOfTransformation': '2021-08-17T12:36:20.367Z',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'dri:objIdentifier': 'dedup_wf_001::77cf0e5914ed474475d6cefa7d4abffe',
          },
        },
      },
    ],
    refineResults: {},
  };
}
