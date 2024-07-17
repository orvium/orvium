import { TransformObjectId } from './expose-id.decorator';
import mongoose from 'mongoose';
import { Exclude, Expose, plainToClass } from 'class-transformer';

@Exclude()
class ExampleDTO {
  @TransformObjectId() @Expose() _id!: string;
  @TransformObjectId() @Expose() mixed!: Record<string, unknown>;
  @TransformObjectId() @Expose() array!: string[];
}

describe('TransformObjectId Decorator', () => {
  it('should transform ObjectId to string', () => {
    const object = {
      _id: new mongoose.Types.ObjectId('61edbe756bda0b871f849eac'),
      mixed: {
        primitive: 34,
        arrayOfPrimitives: [1, 2, 3],
        objectId: new mongoose.Types.ObjectId('61edbe756bda0b871f849eac'),
        arrayInsideObject: [
          new mongoose.Types.ObjectId('61edbe756bda0b871f849eac'),
          new mongoose.Types.ObjectId('61edbe756bda0b871f849eac'),
        ],
      },
      array: [
        new mongoose.Types.ObjectId('61edbe756bda0b871f849eac'),
        new mongoose.Types.ObjectId('61edbe756bda0b871f849eac'),
      ],
    };
    const result = plainToClass(ExampleDTO, object);
    expect(result).toMatchObject({
      _id: '61edbe756bda0b871f849eac',
      mixed: {
        primitive: 34,
        arrayOfPrimitives: [1, 2, 3],
        objectId: '61edbe756bda0b871f849eac',
        arrayInsideObject: ['61edbe756bda0b871f849eac', '61edbe756bda0b871f849eac'],
      },
      array: ['61edbe756bda0b871f849eac', '61edbe756bda0b871f849eac'],
    });
  });
});
