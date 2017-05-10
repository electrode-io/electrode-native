import {config as ernConfig} from '@walmart/ern-util';

exports.command = 'add <repoAlias> <repoUrl>'
exports.desc = 'Add a Cauldron git repository'

exports.builder = {}

exports.handler = function (argv) {
    let cauldronRepositories = ernConfig.getValue('cauldronRepositories', {})
    if (cauldronRepositories[argv.repoAlias]) {
      return console.log(`A Cauldron repository is already associated to ${argv.repoAlias} alias`)
    }
    cauldronRepositories[argv.repoAlias] = argv.repoUrl
    ernConfig.setValue('cauldronRepositories', cauldronRepositories)
    console.log(`Added Cauldron repository ${argv.repoUrl} with alias ${argv.repoAlias}`)
}
