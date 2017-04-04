import JavascriptClientCodegen from "./JavascriptClientCodegen";
import SupportingFile from '../SupportingFile';

export default class ES6Codegen extends JavascriptClientCodegen {
    __templateDir = 'es6';
    invokerPackage = "";


    constructor() {
        super();

        this.__supportingFiles.push(new SupportingFile("babelrc.mustache", "", ".babelrc"));
        this.__supportingFiles.push(new SupportingFile("npmignore.mustache", "", ".npmignore"));
        this.__supportingFiles.push(new SupportingFile("gitignore.mustache", "", ".gitignore"));
        this.usePromises = true;
    }
    processOpts(){
        super.processOpts();
        const f = this[`addSupportingFilesFor${JavascriptClientCodegen.camelize(this.getLibrary())}`];
        f && f.call(this);
    }
    getName() {
        return 'ES6';
    }

    apiFileFolder(templateName, tag) {
        return this.__outputFolder + "/src/api";
    }

}

