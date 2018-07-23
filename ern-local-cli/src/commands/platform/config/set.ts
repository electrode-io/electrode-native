import { config as ernConfig, utils as coreUtils, log } from 'ern-core'
import utils from '../../../lib/utils'
import { Argv } from 'yargs'
import levenshtein from 'fast-levenshtein'

export const command = 'set <key> [value]'
export const desc = 'Sets the key to the value in the configuration file'

export const builder = (argv: Argv) => {
  return argv.epilog(userConfigSchemaString() + utils.epilog(exports))
}

const availableUserConfigKeys = [
  {
    desc: 'Set the log level to use for all commands',
    name: 'logLevel',
    values: ['trace', 'debug', 'info', 'error', 'fatal'],
  },
  {
    desc: 'Show the Electrode Native banner when running commands',
    name: 'showBanner',
    values: [true, false],
  },
  {
    desc: 'Temporary directory to use during commands execution',
    name: 'tmp-dir',
    values: ['string'],
  },
  {
    desc: 'Do not remove temporary directories after command execution',
    name: 'retain-tmp-dir',
    values: [true, false],
  },
  {
    desc: 'Enable package cache [EXPERIMENTAL]',
    name: 'package-cache-enabled',
    values: [true, false],
  },
  {
    desc: 'Max package cache size in bytes',
    name: 'max-package-cache-size',
    values: ['number'],
  },
  {
    desc: 'Code push access key associated with your account',
    name: 'codePushAccessKey',
    values: ['string'],
  },
]

const userConfigSchemaString = () =>
  'The following configuration keys are available :\n' +
  availableUserConfigKeys
    .map(
      e =>
        `${e.name.padEnd(15)} : ${e.desc.padEnd(60)}  [${e.values.join('|')}]`
    )
    .join('\n') +
  '\n\n'

const availableKeys = () => availableUserConfigKeys.map(e => e.name)

const closestKeyName = key =>
  availableKeys().reduce(
    (acc, cur) =>
      levenshtein.get(acc, key) > levenshtein.get(cur, key) ? cur : acc
  )

export const handler = async ({
  key,
  value,
}: {
  key: string
  value?: string
}) => {
  if (!value) {
    throw new Error(`Pass value for ${key} `)
  }
  try {
    if (!availableKeys().includes(key)) {
      throw new Error(
        `Configuration key ${key} does not exists. Did you mean ${closestKeyName(
          key
        )} ?`
      )
    }

    let valueToset: any = value
    if (!isNaN(+value)) {
      valueToset = +value
    } else {
      valueToset = value === 'true' ? true : value === 'false' ? false : value
    }

    ernConfig.setValue(key, valueToset)
    log.info(`${key} set to ${ernConfig.getValue(key)}`)
  } catch (e) {
    coreUtils.logErrorAndExitProcess(e)
  }
}
