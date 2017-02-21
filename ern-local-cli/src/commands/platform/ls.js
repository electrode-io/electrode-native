import chalk from 'chalk';
import {platform, tagOneLine} from '@walmart/ern-util';

const log = require('console-log-level')();

exports.command = 'ls';
exports.desc = 'List platform versions';

exports.builder = {};

exports.handler = function (argv) {
    log.info(tagOneLine`
    ${chalk.green('[CURRENT]')}
    ${chalk.yellow('[INSTALLED]')}
    ${chalk.gray('[NOT INSTALLED]')}`);
    for (const version of platform.versions) {
        if (platform.isPlatformVersionInstalled(version)) {
            if (platform.currentVersion === version) {
                log.info(chalk.green(`-> v${version}`));
            } else {
                log.info(chalk.yellow(`v${version}`))
            }
        } else {
            log.info(chalk.gray(`v${version}`));
        }
    }
};
