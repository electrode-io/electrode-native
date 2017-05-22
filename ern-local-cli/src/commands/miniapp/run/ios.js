import MiniApp from '../../../lib/miniapp'

exports.command = 'ios'
exports.desc = 'Run miniapp in ios runner project'

exports.builder = function (yargs) {
  return yargs
}

exports.handler = async function (argv) {
  await MiniApp.fromCurrentPath().runInIosRunner()
}
