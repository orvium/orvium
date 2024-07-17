import { Transform } from 'class-transformer';
import mongoose from 'mongoose';

/*
 * This decorator should be used to transform Mongo ObjectIds into strings with class-transformer DTOs
 *
 * Explanation:
 *   Since Mongoose v6, ObjectIds are incorrectly serialized into strings by default.
 *   This decorator takes the ObjectId and forces the correct conversion to string.
 *   It works for simple values and arrays of ObjectIds.
 *
 * Related issues:
 *    https://github.com/typestack/class-transformer/issues/991
 *    https://github.com/typestack/class-transformer/issues/1023
 */
export function TransformObjectId(): PropertyDecorator {
  return Transform(
    ({ obj, key }) => {
      return transformObjectIdFunction(obj[key]);
    },
    { toClassOnly: true }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformObjectIdFunction(obj: any): any {
  if (obj instanceof mongoose.Types.ObjectId) {
    return String(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(value => transformObjectIdFunction(value));
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      obj[key] = transformObjectIdFunction(obj[key]);
    }
    return obj;
  }
  return obj;
}
