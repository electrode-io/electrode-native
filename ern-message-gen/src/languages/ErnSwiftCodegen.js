import SwiftCodegen from './SwiftCodegen';
import ernify from './ERNMixin';
import {newHashMap} from '../java/javaUtil';

export default class ErnSwiftCodegen extends SwiftCodegen {
    library = "ern";
    __supportedLibraries = newHashMap(
        ["ern", "ERN plugin makes this platform work"]
    );
    unwrapRequired = true;
    constructor(){
        super();
        this.__typeMapping.put("int", "Int");
        this.__typeMapping.put("integer", "Int");
    }
    processOpts() {
        super.processOpts();
        const f = this[`addSupportingFilesFor${SwiftCodegen.camelize(this.getLibrary())}`];
        f && f.call(this);
    }
    addSupportingFilesForErn(){
        this.__apiTemplateFiles.put("apirequests.mustache", ".swift");
        this.__apiTemplateFiles.put("apievents.mustache", ".swift");
        this.__apiDataTemplateFile.put("apidatamodel.mustache", ".swift");
    }

    getName() {
        return "ERNSwift";
    }
}

ernify(ErnSwiftCodegen);

