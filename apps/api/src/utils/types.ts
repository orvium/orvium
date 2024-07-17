import { Condition, FilterQuery } from 'mongoose';

type MyRootQuerySelector<T> = {
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/and/#op._S_and */
  $and?: FilterQuery<T>[];
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/nor/#op._S_nor */
  $nor?: FilterQuery<T>[];
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/or/#op._S_or */
  $or?: FilterQuery<T>[];
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/text */
  $text?: {
    $search: string;
    $language?: string;
    $caseSensitive?: boolean;
    $diacriticSensitive?: boolean;
  };
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/where/#op._S_where */
  // eslint-disable-next-line @typescript-eslint/ban-types
  $where?: string | Function;
  /** @see https://www.mongodb.com/docs/manual/reference/operator/query/comment/#op._S_comment */
  $comment?: string;
  // we could not find a proper TypeScript generic to support nested queries e.g. 'user.friends.name'
  // this will mark all unrecognized properties as any (including nested queries)
};

export type StrictFilterQuery<T> = {
  [P in keyof T]?: Condition<T[P]>;
} & MyRootQuerySelector<T>;

export type NestedMongoQuery<T, FieldName> = {
  // @ts-expect-error
  [P in keyof T as `${FieldName}.${P}`]: T[P];
};
