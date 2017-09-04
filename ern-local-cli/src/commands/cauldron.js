// @flow

exports.command = 'cauldron'
exports.desc = 'Cauldron access commands'
exports.builder = function (yargs: any) {
  return yargs
    .option('addDependencies', {
      type: 'array',
      describe: 'Adds one or more native dependencies to a native application version'
    })
    .option('addMiniapps', {
      type: 'array',
      describe: 'Adds one or more MiniApps to a native application version'
    })
    .option('delDependencies', {
      type: 'array',
      describe: 'Remove one or more native dependencies from a native application version'
    })
    .option('delMiniapps', {
      type: 'array',
      describe: 'Remove one or more MiniApps from a native application version'
    })
    .option('updateDependencies', {
      type: 'array',
      describe: 'Update one or more native dependencies versions in a native application version'
    })
    .option('updateMiniapps', {
      type: 'array',
      describe: 'Update one or more MiniApps versions in a native appplication version'
    })
    .option('force', {
      alias: 'f',
      type: 'bool',
      describe: 'Force the operations even if some compatibility checks are failing'
    })
    .option('containerVersion', {
      alias: 'v',
      type: 'string',
      describe: 'Version to use for generated container. If none provided, current container version will be patch bumped.'
    })
    .option('descriptor', {
      type: 'string',
      alias: 'd',
      describe: 'A complete native application descriptor target of the operation'
    })
    .commandDir('cauldron')
}

exports.handler = async function ({
  addDependencies,
  addMiniapps,
  delDependencies,
  delMiniapps,
  updateDependencies,
  updateMiniapps,
  force,
  containerVersion,
  descriptor
} : {
  addDependencies?: Array<string>,
  addMiniapps?: Array<string>,
  delDependencies?: Array<string>,
  delMiniapps?: Array<string>,
  updateDependencies?: Array<string>,
  updateMiniapps?: Array<string>,
  force?: boolean,
  containerVersion?: string,
  descriptor?: string
}) {
  console.log('bla')
}
