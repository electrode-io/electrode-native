import { runInAndroidRunner } from '../../../util/miniapp.js';

exports.command = 'android'
exports.desc = 'Run miniapp in android runner project'

exports.builder = {}

exports.handler = function (argv) {
  runInAndroidRunner();
}
