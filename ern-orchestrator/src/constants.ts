export const CONTAINER_YARN_KEY = 'container'

export const availableUserConfigKeys = [
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
    desc: 'Enable package cache',
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
  {
    desc: 'Code push custom server url',
    name: 'codePushCustomServerUrl',
    values: ['string'],
  },
  {
    desc: 'Code push custom proxy url',
    name: 'codePushProxy',
    values: ['string'],
  },
  {
    desc: 'Code push custom http headers',
    name: 'codePushCustomHeaders',
    values: ['string'],
  },
  {
    desc: 'Override Manifest Url',
    name: 'overrideManifestUrlModifier',
    values: ['string'],
  },
  {
    desc: 'Indicates whether to ignore any Cauldron required ern version',
    name: 'ignore-required-ern-version',
    values: [true, false],
  },
]
