import CodegenConfigLoader from '../CodegenConfigLoader';
import { Command } from '../java/cli';
import { log } from 'ern-core';

export default class ConfigHelp {
  public static Usage = new Command(
    { name: 'config-help', description: 'Config help for chosen lang' },
    [
      {
        description: 'language to get config help for',
        hasArg: true,
        name: ['-l', '--lang'],
        required: true,
        title: 'language',
      },
    ],
  );

  public language;

  constructor({ language }) {
    this.language = language;
  }

  public run() {
    const config = CodegenConfigLoader.forName(this.language);
    log.info('CONFIG OPTIONS');

    for (const langCliOption of config.cliOptions()) {
      {
        log.info(`\t ${langCliOption.getOpt()}`);
        log.info(
          `\t    ${langCliOption
            .getOptionHelp()
            .replace(new RegExp('\n', 'g'), '\n\t    ')}`,
        );
      }
    }
  }
}
