export class AppNameDescriptor {
  public static fromString(s: string): AppNameDescriptor {
    if (s.includes(':')) {
      throw new Error(
        `An AppNameDescriptor literal cannot contain the ':' reserved character.`,
      );
    }
    return new AppNameDescriptor(s);
  }

  constructor(public readonly name: string) {}

  public toAppNameDescriptor(): AppNameDescriptor {
    return this;
  }

  public toString() {
    return this.name;
  }
}
