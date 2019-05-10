import CodegenConfigLoader from '../CodegenConfigLoader'
import { Command } from '../java/cli'

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
    ]
  )

  public language

  constructor({ language }) {
    this.language = language
  }

  public run() {
    const config = CodegenConfigLoader.forName(this.language)
    console.info('CONFIG OPTIONS')

    for (const langCliOption of config.cliOptions()) {
      {
        console.info('\t' + langCliOption.getOpt())
        console.info(
          '\t    ' +
            langCliOption
              .getOptionHelp()
              .replace(new RegExp('\n', 'g'), '\n\t    ')
        )
        console.info()
      }
    }
  }
}
