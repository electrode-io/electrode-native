import AndroidClientCodegen from "../languages/AndroidClientCodegen";
import ernify from './ERNMixin';
import {newHashMap} from '../java/javaUtil';
import File from '../java/File';
import SupportingFile from '../SupportingFile';

export default class ErnAndroidApiCodegen extends AndroidClientCodegen {

    sourceFolder = "lib/src/main/java";
    platformVersion = "1.3.0";
    library = "ern";
    __supportedLibraries = newHashMap(["ern", "ERN plugin makes this platform work"]);
    addSupportingFilesForErn(){

        this.__apiTemplateFiles.put("apirequests.mustache", ".java");
        this.__apiTemplateFiles.put("apievents.mustache", ".java");
        this.__apiDataTemplateFile.put("apidatamodel.mustache", ".java");

        this.__supportingFiles.add(new SupportingFile("README.mustache", "", "README.md"));
        this.__supportingFiles.add(new SupportingFile("settings.gradle.mustache", "", "settings.gradle"));
        this.__supportingFiles.add(new SupportingFile("build.mustache", "", "build.gradle"));
        this.__supportingFiles.add(new SupportingFile("lib.build.mustache", "lib", "build.gradle"));
        this.__supportingFiles.add(new SupportingFile("_gitignore", "", ".gitignore"));
        this.__supportingFiles.add(new SupportingFile("gradlew.mustache", "", "gradlew"));
        this.__supportingFiles.add(new SupportingFile("gradle-wrapper.properties.mustache", this.gradleWrapperPackage.split(".").join(File.separator), "gradle-wrapper.properties"));
        this.__supportingFiles.add(new SupportingFile("gradle-wrapper.jar", this.gradleWrapperPackage.split(".").join(File.separator), "gradle-wrapper.jar"));
        this.__supportingFiles.add(new SupportingFile("AndroidManifest.mustache", "lib/src/main", "AndroidManifest.xml"))
    }

    getName() {
        return "ERNAndroid";
    }
}

ernify(ErnAndroidApiCodegen);
