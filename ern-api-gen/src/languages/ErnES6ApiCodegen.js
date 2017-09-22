import ES6Codegen from "../languages/ES6Codegen";
import ernify from './ERNMixin';
import {newHashMap} from '../java/javaUtil';
const {postProcessOperations} = ES6Codegen.prototype;
export const ERN_SUPPORTING = ['index.mustache', 'package.mustache', 'README.mustache'];
export const ERN_REMOVING = ['ApiClient.mustache'];
const contains = (arr, val) => {
    if (arr == null) return false;
    return arr.indexOf(val) > -1;
};

export default class ErnES6ApiCodegen extends ES6Codegen {
    library = "ern";
    classy = false;
    __supportedLibraries = newHashMap(
        ["ern", "ERN plugin makes this platform work"]
    );

    addSupportingFilesForErn() {
        this.__modelTemplateFiles.clear();
        this.__modelTestTemplateFiles.clear();
        this.__modelDocTemplateFiles.clear();
        this.__apiTestTemplateFiles.clear();
        this.__apiDocTemplateFiles.clear();
        //add our special sauce.
        this.__apiTemplateFiles.put("api.mustache", ".js");
        this.__apiTemplateFiles.put("apirequests.mustache", ".js");
        this.__apiTemplateFiles.put("apievents.mustache", ".js");
        this.__apiTestTemplateFiles.put("api_test.mustache", ".js");
        // this.__apiDocTemplateFiles.put("api_doc.mustache", ".md");
        if (this.classy) {
            this.__additionalProperties.put("isClassy", this.classy);
            this.__modelTemplateFiles.put("model.mustache", ".js");
            // this.__modelDocTemplateFiles.put("model_doc.mustache", ".md");
        }
    }

    preprocessSwagger(swagger) {
        super.preprocessSwagger(swagger);
        if (!this.classy) {
            this.__supportingFiles = this.__supportingFiles.filter(v => !contains(ERN_REMOVING, v.templateFile));
        }
    }

    getName() {
        return "ERNES6";
    }
}
ernify(ErnES6ApiCodegen, {
    postProcessOperations(objs){
        objs = postProcessOperations.call(this, objs);
        const operations = objs.get("operations");
        const ops = operations && operations.get("operation");
        if (ops == null)
            return objs;


        for (const op of ops) {
            op.hasSingleParam = op.allParams.length == 1;
            if (op.httpMethod !== 'EVENT') {
                objs.put("hasRequest", true);
                continue;
            }
            op.isEvent = true;
            objs.put("hasEvent", true);
        }
        objs.put("isClassy", this.classy);
        return objs;
    }
});
