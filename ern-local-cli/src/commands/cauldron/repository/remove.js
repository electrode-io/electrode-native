import {
  config as ernConfig
} from '@walmart/ern-util'

exports.command = 'remove <repoAlias>'
exports.desc = 'Remove a cauldron repository given its alias'

exports.builder = {}

exports.handler = function (argv) {
  let cauldronRepositories = ernConfig.getValue('cauldronRepositories')
  if (!cauldronRepositories) {
    return console.log('No Cauldron repositories have been added yet')
  }
  if (!cauldronRepositories[argv.repoAlias]) {
    return console.log(`No Cauldron repository exists with ${argv.repoAlias} alias`)
  }
  delete cauldronRepositories[argv.repoAlias]
  ernConfig.setValue('cauldronRepositories', cauldronRepositories)
  console.log(`Removed Cauldron repository exists with alias ${argv.repoAlias}`)
  const cauldronRepoInUse = ernConfig.getValue('cauldronRepoInUse')
  if (cauldronRepoInUse === argv.repoAlias) {
    ernConfig.setValue('cauldronRepoInUse', null)
    console.log(`This Cauldron repository was the currently activated one. No more current repo !`)
  }
}
