import {
  config as ernConfig
} from '@walmart/ern-util'

exports.command = 'current'
exports.desc = 'Display the currently activated Cauldron repository'

exports.builder = {}

exports.handler = function (argv) {
  const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
  if (!cauldronRepoInUse) {
    return console.log(`No Cauldron repository is in use yet`)
  }
  const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
  console.log(`${cauldronRepoInUse} [${cauldronRepositories[cauldronRepoInUse]}]`)
}
