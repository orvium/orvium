/**
 * OAI verbs.
 */

export enum VERBS {
  IDENTIFY = 'Identify',
  LIST_METADATA_FORMATS = 'ListMetadataFormats',
  LIST_SETS = 'ListSets',
  GET_RECORD = 'GetRecord',
  LIST_IDENTIFIERS = 'ListIdentifiers',
  LIST_RECORDS = 'ListRecords',
}

/**
 * OAI Errors.
 */
export enum ERRORS {
  badArgument = 0,
  badResumptionToken = 1,
  badVerb = 2,
  cannotDisseminateFormat = 4,
  idDoesNotExist = 8,
  noRecordsMatch = 16,
  noMetadataFormats = 32,
  noSetHierarchy = 64,
}

/**
 * DC Type.
 */
export const DC_TYPES = [
  {
    value: 'journal article',
    orviumValue: 'article',
    uri: 'http://purl.org/coar/resource_type/c_6501',
  },
  {
    value: 'book',
    orviumValue: 'book',
    uri: 'http://purl.org/coar/resource_type/c_2f33',
  },
  {
    value: 'book part',
    orviumValue: 'book section',
    uri: 'http://purl.org/coar/resource_type/c_3248',
  },
  {
    value: 'conference paper',
    orviumValue: 'conference paper',
    uri: 'http://purl.org/coar/resource_type/c_5794',
  },
  {
    value: 'report',
    orviumValue: 'report',
    uri: 'http://purl.org/coar/resource_type/c_93fc',
  },
  {
    value: 'patent',
    orviumValue: 'patent',
    uri: 'http://purl.org/coar/resource_type/c_15cd',
  },
  {
    value: 'poster',
    orviumValue: 'poster',
    uri: 'https://vocabularies.coar-.org/resource_types/c_6670/',
  },
  {
    value: 'preprint',
    orviumValue: 'preprint',
    uri: 'http://purl.org/coar/resource_type/c_816b',
  },
  {
    value: 'software',
    orviumValue: 'software documentation',
    uri: 'http://purl.org/coar/resource_type/c_5ce6',
  },
  {
    value: 'thesis',
    orviumValue: 'thesis',
    uri: 'http://purl.org/coar/resource_type/c_46ec',
  },
  {
    value: 'working paper',
    orviumValue: 'working paper',
    uri: 'http://purl.org/coar/resource_type/c_8042',
  },
  {
    value: 'technical documentation',
    orviumValue: 'technical note',
    uri: 'http://purl.org/coar/resource_type/c_71bd',
  },
  {
    value: 'video',
    orviumValue: 'video',
    uri: 'http://purl.org/coar/resource_type/c_12ce',
  },
  {
    value: 'research proposal',
    orviumValue: 'proposal',
    uri: 'http://purl.org/coar/resource_type/c_baaf',
  },
  {
    value: 'review article',
    orviumValue: 'review article',
    uri: 'http://purl.org/coar/resource_type/c_dcae04bc',
  },
  {
    value: 'policy report',
    orviumValue: 'policy report',
    uri: 'http://purl.org/coar/resource_type/c_186u',
  },
  {
    value: 'dataset',
    orviumValue: 'dataset',
    uri: 'http://purl.org/coar/resource_type/c_ddb1',
  },
  {
    value: 'other',
    orviumValue: 'other',
    uri: 'http://purl.org/coar/resource_type/c_1843',
  },
];

/**
 * OAI definition for the Dublin Core metadata format.
 */
export const METADATA_FORMAT_DC = [
  {
    prefix: 'oai_openaire',
    schema: 'https://www.openaire.eu/schema/repo-lit/4.0/openaire.xsd',
    namespace: 'http://namespace.openaire.eu/schema/oaire/',
  },
];

/**
 * OAI definition Resumption Token.
 */
export class ResumptionToken {
  from!: string;
  until!: string;
  limit!: string;
  set?: string;
}
