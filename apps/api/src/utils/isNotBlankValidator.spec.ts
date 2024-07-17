import { IsString, validate } from 'class-validator';
import { IsNotBlankValidator } from './isNotBlankValidator';

class ExampleDTO {
  @IsString()
  @IsNotBlankValidator({ message: 'Title should not be empty' })
  title!: string;
}

describe('IsNotBlankValidator', () => {
  it('should throw when blank', async () => {
    const example = new ExampleDTO();
    example.title = '';
    const result = await validate(example);
    expect(result.length).toBe(1);
  });

  it('should pass when not empty', async () => {
    const example = new ExampleDTO();
    example.title = 'not blank title';
    const result = await validate(example);
    expect(result.length).toBe(0);
  });
});
