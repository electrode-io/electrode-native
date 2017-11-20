import AndroidClientCodegen from "../languages/AndroidClientCodegen";
import ernify from './ERNMixin';
import {newHashMap} from '../java/javaUtil';

export default class ErnAndroidApiCodegen extends AndroidClientCodegen {

    sourceFolder = "lib/src/main/java";
    platformVersion = "1.3.0";
    library = "ern";
    __supportedLibraries = newHashMap(["ern", "ERN plugin makes this platform work"]);

    addSupportingFilesForErn() {

        this.__apiTemplateFiles.put("apirequests.mustache", ".java");
        this.__apiTemplateFiles.put("apievents.mustache", ".java");
        this.__apiDataTemplateFile.put("apidatamodel.mustache", ".java");
    }

    getName() {
        return "ERNAndroid";
    }
}

ernify(ErnAndroidApiCodegen);
