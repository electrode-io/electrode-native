import { NativePlatform, supportedNativePlatforms } from '../NativePlatform';
import { AppNameDescriptor } from './AppNameDescriptor';

export class AppPlatformDescriptor {
  public static fromString(s: string): AppPlatformDescriptor {
    const [name, platform] = s.split(':');
    if (!platform) {
      throw new Error(`Invalid AppPlatformDescriptor literal ${s}.
An AppPlatformDescriptor literal must be formatted as <appPlatform>:<appPlatform>.`);
    }
    if (!supportedNativePlatforms.includes(platform)) {
      throw new Error(`${platform} is not a supported platform.
Supported platforms : ${supportedNativePlatforms.join(' || ')}`);
    }
    return new AppPlatformDescriptor(name, platform as NativePlatform);
  }

  constructor(
    public readonly name: string,
    public readonly platform: NativePlatform,
  ) {}

  public toAppNameDescriptor(): AppNameDescriptor {
    return new AppNameDescriptor(this.name);
  }

  public toAppPlatformDescriptor(): AppPlatformDescriptor {
    return this;
  }

  public toString() {
    return `${this.name}:${this.platform}`;
  }
}
