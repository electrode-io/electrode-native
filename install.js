const child_process = require('child_process');
const fs = require('fs');

const execSync = child_process.execSync;
const ERN_PATH = `${process.env['HOME']}/.ern`;
const ERN_PLATFORM_REPO_PATH = `${ERN_PATH}/ern-platform`;
const ERN_VERSIONS_CACHE_PATH = `${ERN_PATH}/cache`;
const ERN_RC_FILE_PATH = `${ERN_PATH}/.ernrc`;

// shouldSwitchToVersion: true if wish to switch to the installed version
// upon installation complete. false otherwise
exports.install = (shouldSwitchToVersion) => {
  const PLATFORM_VERSION =
    JSON.parse(fs.readFileSync(`${ERN_PLATFORM_REPO_PATH}/manifest.json`, 'utf-8')).platformVersion;
  const PLATFORM_VERSION_PATH = `${ERN_VERSIONS_CACHE_PATH}/v${PLATFORM_VERSION}`;

  if (fs.existsSync(PLATFORM_VERSION_PATH)) {
    console.log(`Version ${PLATFORM_VERSION} already installed`);
  }

  console.log('Starting platform installation');
  execSync(`cp -rf ${ERN_PLATFORM_REPO_PATH} ${PLATFORM_VERSION_PATH}`);
  console.log('=> Installing cauldron-cli');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-cauldron-cli`);
  execSync(`yarn install`);
  console.log('=> Installing ern-api-gen');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-api-gen`);
  execSync(`yarn install`);
  console.log('=> Installing ern-container-gen');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-container-gen`);
  execSync(`yarn install`);
  console.log('=> Installing ern-local-cli');
  process.chdir(`${PLATFORM_VERSION_PATH}/ern-local-cli`);
  execSync(`npm install`);
  execSync(`rm -rf ${PLATFORM_VERSION_PATH}/.git`);
  const ernRc = JSON.parse(fs.readFileSync(ERN_RC_FILE_PATH, 'utf-8'));
  ernRc.platformVersion = PLATFORM_VERSION;
  if (!ernRc.cauldronUrl) {
    ernRc.cauldronUrl = "http://localhost:3000";
  }
  if (!ernRc.libgen) {
    ernRc.libgen = {
      android: {
        generator: {
          platform: "android",
          name: "maven"
        }
      }
    }
  }
  fs.writeFileSync(ERN_RC_FILE_PATH, JSON.stringify(ernRc, null, 2));

  console.log(`Hurray ! Platform installed @ v${PLATFORM_VERSION}`);
}
