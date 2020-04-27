/* tslint:disable:variable-name */
export class TemplateLocator {
  public __parent;

  constructor(__parent) {
    this.__parent = __parent;
  }

  public getTemplate(name) {
    return this.__parent.getTemplateReader(
      this.__parent.getFullTemplateFile(
        this.__parent.config,
        name + '.mustache',
      ),
    );
  }
}
