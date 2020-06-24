import { log } from 'ern-core';
import _F from './java/File';
import fs from 'fs';
import path from 'path';

const File = _F;

const ABSTRACT_SEARCH_PATHS = [path.join(__dirname, '..', 'resources')];

export default class AbstractGenerator {
  public static SEARCH_PATHS = ABSTRACT_SEARCH_PATHS;

  public writeToFile(filename, contents) {
    log.info('writing file ' + filename);
    const f = new File(filename);
    f.getParentFile().mkdirs();
    return fs.writeFileSync(f.getPath(), contents, 'utf8');
  }

  public readTemplate(name) {
    const reader = this.getTemplateReader(name);
    if (reader == null) {
      throw new Error(`no file found for "${name}"`);
    }
    return reader;
  }

  public getTemplateReader(name) {
    const f = this._resolveFilePath(name);
    if (f == null) {
      throw new Error("can't load template " + name);
    }
    try {
      return fs.readFileSync(f, 'utf-8');
    } catch (e) {
      log.trace(e);
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
  public getFullTemplateFile(config, templateFile) {
    const library = config.getLibrary();
    if (library) {
      const libTemplateFile = this._resolveFilePath(
        config.embeddedTemplateDir(),
        'libraries',
        library,
        templateFile,
      );
      if (libTemplateFile != null) {
        return libTemplateFile;
      }
    }

    const embeddedTemplate = this._resolveFilePath(
      config.embeddedTemplateDir(),
      templateFile,
    );
    if (embeddedTemplate != null) {
      return embeddedTemplate;
    }

    const template = this._resolveFilePath(config.templateDir(), templateFile);
    if (template != null) {
      return template;
    }
  }

  public readResourceContents(resourceFilePath) {
    const file = this._resolveFilePath(resourceFilePath);
    if (file == null) {
      log.warn(`Could not resolve ${resourceFilePath}`);
      return;
    }

    return fs.readFileSync(file, 'utf8');
  }

  public embeddedTemplateExists(name) {
    const f = this._resolveFile(name);
    return f != null;
  }

  public getCPResourcePath(name) {
    if (!('/' === File.separator)) {
      return name.replace(new RegExp(File.separator, 'g'), '/');
    }
    return name;
  }

  protected _resolveFilePath(...paths) {
    const f = this._resolveFile(...paths);
    if (f == null) {
      return;
    }
    return f.getAbsolutePath();
  }

  protected _resolveFile(...paths) {
    for (const p of AbstractGenerator.SEARCH_PATHS) {
      const file = new File(p, ...paths);
      if (file.exists()) {
        return file;
      }
    }
    const last = new File(paths.shift(), ...paths);
    if (last.exists()) {
      return last;
    }
  }
}
