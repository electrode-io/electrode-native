/* tslint:disable:max-classes-per-file */
import File from '../java/File';
import Mustache from '../java/Mustache';
import DefaultGenerator from '../DefaultGenerator';
import SupportingFile from '../SupportingFile';
import { log } from 'ern-core';
import camelCase from 'lodash/camelCase';
import { newHashMap } from '../java/javaUtil';
import FileUtils from '../java/FileUtils';
import { Command } from '../java/cli';
import { apply } from '../java/beanUtils';

export default class Meta {
  public static Usage = new Command(
    {
      description:
        'MetaGenerator. Generator for creating a new template set ' +
        'and configuration for Codegen.  The output will be based on the language you ' +
        'specify, and includes default templates to include.',
      name: 'meta',
    },
    [
      {
        description:
          'where to write the generated files ({current dir by default},',
        hasArg: true,
        name: ['-o', '--output'],
        property: 'outputFolder',
        required: true,
        title: 'output directory',
      },
      {
        description: 'the human-readable name of the generator',
        hasArg: true,
        name: ['-n', '--name'],
        title: 'name',
      },
      {
        description: 'the swagger version to use',
        hasArg: true,
        name: ['-s', '--swaggerVersion'],
        title: 'swagger version',
      },
      {
        description:
          'the package to put the main class into ({defaults to io.swagger.codegen},',
        hasArg: true,
        name: ['-p', '--package'],
        property: 'targetPackage',
        title: 'package',
      },
    ],
  );

  public static TEMPLATE_DIR_CLASSPATH = 'codegen';
  public static MUSTACHE_EXTENSION = '.mustache';

  /**
   * Converter method to process supporting files: execute with mustache,
   * or simply copy to destination directory
   *
   * @param targetDir - destination directory
   * @param data      - map with additional params needed to process templates
   * @return converter object to pass to lambdaj
   */
  public static processFiles(targetDir, data) {
    return new Writer(targetDir, data);
  }

  /**
   * Creates mustache loader for template using classpath loader
   *
   * @param generator - class with reader getter
   * @return loader for template
   */
  public static loader(generator) {
    return new Reader(generator);
  }

  /**
   * Converts package name to path on file system
   *
   * @param packageName - package name to convert
   * @return relative path
   */
  public static asPath(packageName) {
    return packageName.split('.').join(File.separator);
  }

  public outputFolder = '';
  public name = 'default';
  public targetPackage = 'io.swagger.codegen';
  public swaggerVersion;

  constructor(values) {
    apply(this, values);
  }

  public getImplementationVersion() {
    return (this.swaggerVersion = '2.1.3');
  }

  public run() {
    const targetDir = new File(this.outputFolder);
    log.info(`writing to folder [${targetDir.getAbsolutePath()}]`);
    const mainClass = camelCase(this.name) + 'Generator';
    const supportingFiles = [
      new SupportingFile('pom.mustache', '', 'pom.xml'),
      new SupportingFile(
        'generatorClass.mustache',
        ['src/main/java', Meta.asPath(this.targetPackage)].join(File.separator),
        mainClass + '.java',
      ),
      new SupportingFile('README.mustache', '', 'README.md'),
      new SupportingFile(
        'api.template',
        'src/main/resources' + File.separator + this.name,
        'api.mustache',
      ),
      new SupportingFile(
        'model.template',
        'src/main/resources' + File.separator + this.name,
        'model.mustache',
      ),
      new SupportingFile(
        'services.mustache',
        'src/main/resources/META-INF/services',
        'io.swagger.codegen.CodegenConfig',
      ),
    ];
    let swaggerVersion = this.getImplementationVersion();
    if (swaggerVersion == null) {
      swaggerVersion = '2.1.3';
    }
    const data = newHashMap(
      ['generatorPackage', this.targetPackage],
      ['generatorClass', mainClass],
      ['name', this.name],
      ['fullyQualifiedGeneratorClass', this.targetPackage + '.' + mainClass],
      ['swaggerCodegenVersion', swaggerVersion],
    );
    supportingFiles.forEach(Meta.processFiles(targetDir, data).convert);
  }
}

export class Writer {
  public targetDir;
  public data;
  public generator;

  constructor(targetDir, data) {
    this.targetDir = targetDir;
    this.data = data;
    this.generator = new DefaultGenerator();
  }

  public convert = support => {
    try {
      const destinationFolder = new File(
        new File(this.targetDir.getAbsolutePath()),
        support.folder,
      );
      const outputFile = new File(
        destinationFolder,
        support.destinationFilename,
      );
      const template = this.generator.readTemplate(
        new File(Meta.TEMPLATE_DIR_CLASSPATH, support.templateFile).getPath(),
      );
      let formatted = template;
      if (support.templateFile.endsWith(Meta.MUSTACHE_EXTENSION)) {
        log.info(`writing file to ${outputFile.getAbsolutePath()}`);
        formatted = Mustache.compiler()
          .withLoader(Meta.loader(this.generator))
          .defaultValue('')
          .compile(template)
          .execute(this.data);
      } else {
        log.info(`copying file to ${outputFile.getAbsolutePath()}`);
      }
      FileUtils.writeStringToFile(outputFile, formatted);
      return outputFile;
    } catch (e) {
      throw new Error("Can't generate project");
    }
  };
}
export class Reader {
  public generator;

  constructor(generator) {
    this.generator = generator;
  }

  public getTemplate(name) {
    return this.generator.getTemplateReader(
      Meta.TEMPLATE_DIR_CLASSPATH +
        File.separator +
        name +
        Meta.MUSTACHE_EXTENSION,
    );
  }
}
