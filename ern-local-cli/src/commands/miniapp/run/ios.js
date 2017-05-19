import MiniApp from '../../../lib/miniapp'

exports.command = 'ios'
exports.desc = 'Run miniapp in ios runner project'

exports.builder = function (yargs) {
  return yargs
        .option('verbose', {
          type: 'bool',
          describe: 'Verbose output'
        })
}

exports.handler = async function (argv) {
  await MiniApp.fromCurrentPath().runInIosRunner(argv.verbose)
}
