export class Command {
  public name;
  public description;
  public options;

  constructor({ name, description }, options: any = []) {
    this.name = name;
    this.description = description;
    this.options = options;
  }
}
