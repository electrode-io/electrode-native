import {config as ernConfig} from '@walmart/ern-util';

exports.command = 'list'
exports.desc = 'List all Cauldron repositories'

exports.builder = {}

exports.handler = function (argv) {
    const cauldronRepositories = ernConfig.getValue('cauldronRepositories')
    if (!cauldronRepositories) {
      return console.log('No Cauldron repositories have been added yet')
    }
    console.log('[Cauldron Repositories]')
    Object.keys(cauldronRepositories).forEach(alias => 
      console.log(`${alias} -> ${cauldronRepositories[alias]}`))
}
