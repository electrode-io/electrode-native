/* tslint:disable:variable-name */
import JavascriptClientCodegen from './JavascriptClientCodegen';
import SupportingFile from '../SupportingFile';

export default class ES6Codegen extends JavascriptClientCodegen {
  public __templateDir = 'es6';
  public invokerPackage = '';

  constructor() {
    super();
    this.__supportingFiles = this.__supportingFiles.filter(
      (v) => v.templateFile !== 'mocha.opts',
    );
    this.__supportingFiles.push(
      new SupportingFile('babelrc.mustache', '', '.babelrc'),
    );
    this.__supportingFiles.push(
      new SupportingFile('npmignore.mustache', '', '.npmignore'),
    );
    this.__supportingFiles.push(
      new SupportingFile('gitignore.mustache', '', '.gitignore'),
    );

    this.usePromises = true;
  }

  public processOpts() {
    super.processOpts();
    const f =
      this[
        `addSupportingFilesFor${JavascriptClientCodegen.camelize(
          this.getLibrary(),
        )}`
      ];
    if (f) {
      f.call(this);
    }
  }

  public getName() {
    return 'ES6';
  }

  public apiFileFolder() {
    return this.__outputFolder + '/src/api';
  }
}
