import { AppVersionDescriptor } from './AppVersionDescriptor';
import { AppNameDescriptor } from './AppNameDescriptor';
import { AppPlatformDescriptor } from './AppPlatformDescriptor';
import { NativePlatform } from '../NativePlatform';

export * from './AppNameDescriptor';
export * from './AppPlatformDescriptor';
export * from './AppVersionDescriptor';

export type CompleteAppDescriptor = AppVersionDescriptor;
export type PartialAppDescriptor = AppNameDescriptor | AppPlatformDescriptor;
export type AnyAppDescriptor = PartialAppDescriptor | CompleteAppDescriptor;

declare global {
  interface String {
    toAppDescriptor(this: string): AnyAppDescriptor;
  }
}

String.prototype.toAppDescriptor = function (this: string): AnyAppDescriptor {
  const arr: string[] = this.split(':');
  if (arr.length > 3) {
    throw new Error(`{this} is not a valid application descriptor`);
  }
  return arr.length === 1
    ? new AppNameDescriptor(arr[0])
    : arr.length === 2
    ? new AppPlatformDescriptor(arr[0], arr[1] as NativePlatform)
    : new AppVersionDescriptor(arr[0], arr[1] as NativePlatform, arr[2]);
};
