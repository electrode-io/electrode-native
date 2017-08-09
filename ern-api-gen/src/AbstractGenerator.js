import LoggerFactory from "./java/LoggerFactory";
import _F from "./java/File";
import fs from "fs";
import path from "path";
const File = _F;

const ABSTRACT_SEARCH_PATHS = [path.join(__dirname, "..", "resources")];

export default class AbstractGenerator {
    static SEARCH_PATHS = ABSTRACT_SEARCH_PATHS;

    writeToFile(filename, contents) {
        Log.info("writing file " + filename);
        const f = new File(filename);
        f.getParentFile().mkdirs();
        return fs.writeFileSync(f.getPath(), contents, 'utf8');
    }

    readTemplate(name) {
        const reader = this.getTemplateReader(name);
        if (reader == null) {
            throw new Error(`no file found for "${name}"`);
        }
        return reader;
    }

    getTemplateReader(name) {
        const f = this._resolveFilePath(name);
        if (f == null) {
            throw new Error("can\'t load template " + name);
        }
        try {
            return fs.readFileSync(f, 'utf-8');
        }
        catch (e) {
            Log.trace(e);
        }


    }

    /**
     * Get the template file path with template dir prepended, and use the
     * library template if exists.
     *
     * Resolve from embeddedTemplate/library, than embeddedTemplate,  then templateDir
     *
     * @param config Codegen config
     * @param templateFile Template file
     * @return String Full template file path
     */
    getFullTemplateFile(config, templateFile) {
        let library = config.getLibrary();
        if (library) {
            const libTemplateFile = this._resolveFilePath(config.embeddedTemplateDir(), "libraries", library, templateFile);
            if (libTemplateFile != null) {
                return libTemplateFile;
            }
        }

        const embeddedTemplate = this._resolveFilePath(config.embeddedTemplateDir(), templateFile);
        if (embeddedTemplate != null) {
            return embeddedTemplate;
        }

        const template = this._resolveFilePath(config.templateDir(), templateFile);
        if (template != null) {
            return template;
        }

    }

    readResourceContents(resourceFilePath) {
        const file = this._resolveFilePath(resourceFilePath);
        if (file == null) {
            Log.warn(`Could not resolve ${resourceFilePath}`);
            return;
        }

        return fs.readFileSync(file, 'utf8');

    }

    _resolveFilePath(...paths) {
        const f = this._resolveFile(...paths);
        if (f == null) {
            return;
        }
        return f.getAbsolutePath();
    }

    _resolveFile(...paths) {
        for (const p of this.constructor.SEARCH_PATHS) {
            const file = new File(p, ...paths);
            if (file.exists()) {
                return file;
            }
        }
        const last = new File(...paths);
        if (last.exists()) {
            return last;
        }
    }

    embeddedTemplateExists(name) {
        const f = this._resolveFile(name);
        return f != null;
    }

    getCPResourcePath(name) {
        if (!("/" === File.separator)) {
            return name.replace(new RegExp(File.separator, 'g'), "/");
        }
        return name;
    }
}
const Log = LoggerFactory.getLogger(AbstractGenerator);
