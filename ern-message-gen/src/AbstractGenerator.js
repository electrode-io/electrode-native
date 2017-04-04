import LoggerFactory from "./java/LoggerFactory";
import _F from "./java/File";
import fs from "fs";
import path from "path";
const File = _F;
export default class AbstractGenerator {

    writeToFile(filename, contents) {
        Log.info("writing file " + filename);
        const f = new File(filename);
        f.getParentFile().mkdirs();
        return fs.writeFileSync(f.getPath(), contents, 'utf8');
    }

    readTemplate(name) {
        const reader = this.getTemplateReader(name.startsWith("resources") ? name : "resources/" + name);
        if (reader == null) {
            throw new Error(`no file found for "${name}"`);
        }
        return reader;
    }

    getTemplateReader(name) {
        const f = new File(__dirname, '..', name);
        try {
            return fs.readFileSync(f.getPath(), 'utf-8');
        }
        catch (e) {
            Log.trace(e);
        }

        throw new Error("can\'t load template " + name);
    }

    /**
     * Get the template file path with template dir prepended, and use the
     * library template if exists.
     *
     * @param config Codegen config
     * @param templateFile Template file
     * @return String Full template file path
     */
    getFullTemplateFile(config, templateFile) {
        let template = config.templateDir() + File.separator + templateFile;
        if (new File(template).exists()) {
            return template;
        }
        else {
            let library = config.getLibrary();
            if (library) {
                const libTemplateFile = 'resources' + File.separator + config.embeddedTemplateDir() + File.separator + "libraries" + File.separator + library + File.separator + templateFile;
                if (this.embeddedTemplateExists(libTemplateFile)) {
                    return libTemplateFile;
                }
            }
            const fp = 'resources' + File.separator + config.embeddedTemplateDir() + File.separator + templateFile;
            return fp;
        }
    }

    readResourceContents(resourceFilePath) {
        return fs.readFileSync(path.join(__dirname, '..', "resources", resourceFilePath), 'utf8');
    }

    embeddedTemplateExists(name) {
        return new File(__dirname, '..', name).exists();
    }

    getCPResourcePath(name) {
        if (!("/" === File.separator)) {
            return name.replace(new RegExp(File.separator, 'g'), "/");
        }
        return name;
    }
}
const Log = LoggerFactory.getLogger(AbstractGenerator);
