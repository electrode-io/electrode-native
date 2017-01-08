const child_process = require('child_process');
const fs = require('fs');

const execSync = child_process.execSync;
const ERN_PATH = `${process.env['HOME']}/.ern`;
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;

exports.uninstall = () => {
  const PLATFORM_VERSION =
    JSON.parse(fs.readFileSync(`${ERN_PLATFORM_REPO_PATH}/manifest.json`, 'utf-8')).platformVersion;
  const PLATFORM_VERSION_PATH = `${ERN_VERSIONS_CACHE_PATH}/v${PLATFORM_VERSION}`;

  execSync(`rm -rf ${PLATFORM_VERSION_PATH}`);

  console.log('done.');
}
