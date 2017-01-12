const child_process = require('child_process');
const execSync = child_process.execSync;
const fs = require('fs');

// Path to ern platform root folder
const ERN_PATH = `${process.env['HOME']}/.ern`;
// Path to ern platform cloned git repo
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
// Path to ern platform cache folder (containing all installed cached versions of the platform)
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;

exports.uninstall = () => {
  // Just get the version from the manifest
  const PLATFORM_VERSION =
    JSON.parse(fs.readFileSync(`${ERN_PLATFORM_REPO_PATH}/manifest.json`, 'utf-8')).platformVersion;
  const PLATFORM_VERSION_PATH = `${ERN_VERSIONS_CACHE_PATH}/v${PLATFORM_VERSION}`;

  // Just remove the cache folder corresponding to this version
  execSync(`rm -rf ${PLATFORM_VERSION_PATH}`);

  console.log('done.');
}
