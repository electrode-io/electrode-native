import { NativePlatform, supportedNativePlatforms } from '../NativePlatform';
import { AppPlatformDescriptor } from './AppPlatformDescriptor';
import { AppNameDescriptor } from './AppNameDescriptor';

export class AppVersionDescriptor {
  public static fromString(s: string): AppVersionDescriptor {
    const [name, platform, version] = s.split(':');
    if (!version || !platform) {
      throw new Error(`Invalid AppVersionDescriptor literal ${s}.
An AppVersionDescriptor literal must be formatted as <appName>:<appPlatform>:<appVersion>.`);
    }
    if (!supportedNativePlatforms.includes(platform)) {
      throw new Error(`${platform} is not a supported platform.
Supported platforms : ${supportedNativePlatforms.join(' || ')}`);
    }
    return new AppVersionDescriptor(name, platform as NativePlatform, version);
  }

  constructor(
    public readonly name: string,
    public readonly platform: NativePlatform,
    public readonly version: string,
  ) {}

  public toAppPlatformDescriptor(): AppPlatformDescriptor {
    return new AppPlatformDescriptor(this.name, this.platform);
  }

  public toAppNameDescriptor(): AppNameDescriptor {
    return new AppNameDescriptor(this.name);
  }

  public toString() {
    return `${this.name}:${this.platform}:${this.version}`;
  }
}
