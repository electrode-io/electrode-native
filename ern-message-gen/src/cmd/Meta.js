import File from "../java/File";
import Mustache from "../java/Mustache";
import DefaultGenerator from "../DefaultGenerator";
import SupportingFile from "../SupportingFile";
import LoggerFactory from "../java/LoggerFactory";
import camelCase from "lodash/camelCase";
import {newHashMap} from "../java/javaUtil";
import FileUtils from "../java/FileUtils";
import {Command} from '../java/cli';
import {apply} from '../java/beanUtils';

export default class Meta {

    static Usage = new Command({
        name: "meta", description: "MetaGenerator. Generator for creating a new template set " +
        "and configuration for Codegen.  The output will be based on the language you " +
        "specify, and includes default templates to include."
    }, [

        {
            name: ["-o", "--output"], title: "output directory", hasArg: true, property: 'outputFolder', required: true,
            description: "where to write the generated files ({current dir by default},"
        },

        {
            name: ["-n", "--name"], title: "name", hasArg: true,
            description: "the human-readable name of the generator"
        },
        {
            name: ["-s", "--swaggerVersion"], title: "swagger version", hasArg: true,
            description: "the swagger version to use"
        },

        {
            name: ["-p", "--package"], title: "package", property: 'targetPackage', hasArg: true,
            description: "the package to put the main class into ({defaults to io.swagger.codegen},"
        }
    ]);

    static TEMPLATE_DIR_CLASSPATH = "codegen";
    static MUSTACHE_EXTENSION = ".mustache";
    outputFolder = "";
    name = "default";
    targetPackage = "io.swagger.codegen";

    constructor(values) {
        apply(this, values);
    }
    getImplementationVersion(){
        return this.swaggerVersion = '2.1.3'
    }
    run() {
        const targetDir = new File(this.outputFolder);
        Log.info("writing to folder [{}]", targetDir.getAbsolutePath());
        const mainClass = camelCase(this.name) + "Generator";
        const supportingFiles = [
            new SupportingFile("pom.mustache", "", "pom.xml"),
            new SupportingFile("generatorClass.mustache", ["src/main/java", Meta.asPath(this.targetPackage)].join(File.separator), mainClass + ".java"),
            new SupportingFile("README.mustache", "", "README.md"),
            new SupportingFile("api.template", "src/main/resources" + File.separator + this.name, "api.mustache"),
            new SupportingFile("model.template", "src/main/resources" + File.separator + this.name, "model.mustache"),
            new SupportingFile("services.mustache", "src/main/resources/META-INF/services", "io.swagger.codegen.CodegenConfig")
        ];
        let swaggerVersion = this.getImplementationVersion();
        if (swaggerVersion == null) {
            swaggerVersion = "2.1.3";
        }
        const data = newHashMap(["generatorPackage", this.targetPackage], ["generatorClass", mainClass], ["name", this.name], ["fullyQualifiedGeneratorClass", this.targetPackage + "." + mainClass], ["swaggerCodegenVersion", swaggerVersion]);
        supportingFiles.forEach(Meta.processFiles(targetDir, data).convert);
    }

    /**
     * Converter method to process supporting files: execute with mustache,
     * or simply copy to destination directory
     *
     * @param targetDir - destination directory
     * @param data      - map with additional params needed to process templates
     * @return converter object to pass to lambdaj
     */
    static processFiles(targetDir, data) {
        return new Writer(targetDir, data)
    }

    /**
     * Creates mustache loader for template using classpath loader
     *
     * @param generator - class with reader getter
     * @return loader for template
     */
    static loader(generator) {
        return new Reader(generator);
    }

    /**
     * Converts package name to path on file system
     *
     * @param packageName - package name to convert
     * @return relative path
     */
    static asPath(packageName) {
        return packageName.split(".").join(File.separator);
    }
}

export class Writer {
    constructor(targetDir, data) {
        this.targetDir = targetDir;
        this.data = data;
        this.generator = new DefaultGenerator();
    }

    convert = (support) => {
        try {
            let destinationFolder = new File(new File(this.targetDir.getAbsolutePath()), support.folder);
            let outputFile = new File(destinationFolder, support.destinationFilename);
            let template = this.generator.readTemplate(new File(Meta.TEMPLATE_DIR_CLASSPATH, support.templateFile).getPath());
            let formatted = template;
            if (support.templateFile.endsWith(Meta.MUSTACHE_EXTENSION)) {
                Log.info("writing file to {}", outputFile.getAbsolutePath());
                formatted = Mustache.compiler().withLoader(Meta.loader(this.generator)).defaultValue("").compile(template).execute(this.data);
            }
            else {
                Log.info("copying file to {}", outputFile.getAbsolutePath());
            }
            FileUtils.writeStringToFile(outputFile, formatted);
            return outputFile;
        }
        catch (e) {
            throw new Error("Can\'t generate project", e);
        }

    }
}
export class Reader {
    constructor(generator) {
        this.generator = generator;
    }

    getTemplate(name) {
        return this.generator.getTemplateReader(Meta.TEMPLATE_DIR_CLASSPATH + File.separator + name + Meta.MUSTACHE_EXTENSION);
    }
}

const Log = LoggerFactory.getLogger(Meta);
