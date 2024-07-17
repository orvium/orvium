import { ClassConstructor, plainToInstance } from 'class-transformer';
import { ClassTransformOptions } from 'class-transformer/types/interfaces';

export function plainToClassCustom<T, V>(
  cls: ClassConstructor<T>,
  plain: V[],
  options?: ClassTransformOptions
): T[];
export function plainToClassCustom<T, V>(
  cls: ClassConstructor<T>,
  plain: V,
  options?: ClassTransformOptions
): T;
export function plainToClassCustom<T, V>(
  cls: ClassConstructor<T>,
  plain: V[] | V,
  options?: ClassTransformOptions
): T[] | T {
  const extendedOptions: ClassTransformOptions = {
    exposeDefaultValues: true,
    ...options,
  };
  return plainToInstance(cls, plain, extendedOptions);
}
