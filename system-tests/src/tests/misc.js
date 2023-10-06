const chalk = require('chalk');
const tmp = require('tmp');
const path = require('path');
const afterAll = require('../utils/afterAll');
const assert = require('../utils/assert');
const randomInt = require('../utils/randomInt');
const sameDirContent = require('../utils/sameDirContent');
const run = require('../utils/run');
const f = require('../../fixtures/constants');
const fs = require('fs');
const os = require('os');
const shell = require('shelljs');

const workingDirectoryPath = process.cwd();
const info = chalk.bold.blue;
const androidNativeApplicationDescriptor = `${f.systemTestNativeApplicationName}:android:${f.systemTestNativeApplicationVersion1}`;
const iosNativeApplicationDescriptor = `${f.systemTestNativeApplicationName}:ios:${f.systemTestNativeApplicationVersion1}`;
const iosNativeApplicationDescriptorNewVersion = `${f.systemTestNativeApplicationName}:ios:${f.systemTestNativeApplicationVersion2}`;

const ERN_ROOT_PATH = process.env.ERN_HOME || path.join(os.homedir(), '.ern');
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_ROOT_PATH, '.ernrc');
const ernConfigObj = fs.existsSync(ERN_RC_GLOBAL_FILE_PATH)
  ? JSON.parse(fs.readFileSync(ERN_RC_GLOBAL_FILE_PATH, 'utf-8'))
  : {};
const defaultAndroidContainerGenPath = path.join(
  ERN_ROOT_PATH,
  'containergen/out/android',
);

process.env['SYSTEM_TESTS'] = 'true';
process.on('SIGINT', () => afterAll());

console.log(
  info(`Entering temporary working directory : ${workingDirectoryPath}`),
);
process.chdir(workingDirectoryPath);

// Cauldron repo
run('cauldron repo clear');
run(
  `cauldron repo add ${f.cauldronName} ${
    tmp.dirSync({ unsafeCleanup: true }).name
  } --current=false`,
);
run(`cauldron repo use ${f.cauldronName}`);
run('cauldron repo current');
run('cauldron repo list');

run('compat-check', { expectedExitCode: 1 });

// Miniapp commands
run(
  `create-miniapp ${f.systemTestMiniAppName} --packageName ${f.systemTestMiniAppPkgName} --skipInstall`,
);
const miniAppPath = path.join(process.cwd(), f.systemTestMiniAppName);
console.log(info(`Entering ${miniAppPath}`));
process.chdir(miniAppPath);
run('add react-native-electrode-bridge');
let packageJson = JSON.parse(fs.readFileSync('package.json'));
if (
  !Object.keys(packageJson.dependencies).includes(
    'react-native-electrode-bridge',
  )
) {
  throw new Error(
    'react-native-electrode-bridge dependency was not added to the MiniApp',
  );
}
run(`add ${f.movieApiImplNativePkgName}@${f.movieApiImplNativePkgVersion}`);
packageJson = JSON.parse(fs.readFileSync('package.json'));
if (
  !Object.keys(packageJson.dependencies).includes(f.movieApiImplNativePkgName)
) {
  throw new Error(
    `${f.movieApiImplNativePkgName} dependency was not added to the MiniApp`,
  );
}

// list dependencies command
run('list dependencies');
run(
  `list dependencies ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion}`,
);

// Cauldron access commands
run(`cauldron add nativeapp ${androidNativeApplicationDescriptor}`);
run(`cauldron get nativeapp ${androidNativeApplicationDescriptor}`);
run(`cauldron add nativeapp ${iosNativeApplicationDescriptor}`);
run(`cauldron get nativeapp ${iosNativeApplicationDescriptor}`);
run(
  `cauldron add miniapps ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -d ${androidNativeApplicationDescriptor}`,
);
run(`cauldron get nativeapp ${androidNativeApplicationDescriptor}`);
run(
  `cauldron add miniapps ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -d ${iosNativeApplicationDescriptor}`,
  { expectedExitCode: process.platform === 'darwin' ? 0 : 1 },
);
run(`cauldron get nativeapp ${iosNativeApplicationDescriptor}`);
run(
  `cauldron add miniapps ${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion} -d ${androidNativeApplicationDescriptor}`,
);
run(`cauldron get nativeapp ${androidNativeApplicationDescriptor}`);
run(
  `cauldron add miniapps ${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion} -d ${iosNativeApplicationDescriptor}`,
  { expectedExitCode: process.platform === 'darwin' ? 0 : 1 },
);
run(`cauldron get nativeapp ${iosNativeApplicationDescriptor}`);
run(
  `cauldron add nativeapp ${iosNativeApplicationDescriptorNewVersion} -c 1000.1000.1`,
  { expectedExitCode: 1 },
);
run(
  `cauldron add nativeapp ${iosNativeApplicationDescriptorNewVersion} -c latest`,
);
run(`cauldron get dependency ${iosNativeApplicationDescriptorNewVersion}`);
run(
  `cauldron add jsapiimpls ${f.movieApiImplJsPkgName}@${f.movieApiImplJsPkgVersion} -d ${androidNativeApplicationDescriptor}`,
);
run(
  `cauldron add jsapiimpls ${f.movieApiImplJsPkgName}@${f.movieApiImplJsPkgVersion} -d ${iosNativeApplicationDescriptor}`,
  { expectedExitCode: process.platform === 'darwin' ? 0 : 1 },
);
run(`cauldron get nativeapp`);

// Already existing miniapp
run(
  `cauldron add miniapps ${f.movieDetailsMiniAppPkgName}@${f.movieDetailsMiniAppPkgVersion} -d ${androidNativeApplicationDescriptor}`,
  { expectedExitCode: 1 },
);
// Non published miniapp
run(
  `cauldron add miniapps ${f.notInNpmPkg} -d ${androidNativeApplicationDescriptor}`,
  { expectedExitCode: 1 },
);

// Escape backslashes on Windows
const miniApp = `file:${
  process.platform === 'win32'
    ? miniAppPath.replace(/\\/g, '\\\\')
    : miniAppPath
}`;
// Container gen should be successful for the two following commands
run(`create-container -m ${miniApp} -p android`);
run(`create-container -m ${miniApp} -p ios --skipInstall`);

// transform-container / publish-container should be successful
run(
  `transform-container --containerPath ${defaultAndroidContainerGenPath} --platform android --transformer dummy`,
);
run(
  `publish-container --containerPath ${defaultAndroidContainerGenPath} --platform android --publisher dummy`,
);

// Del miniapp
run(
  `cauldron del miniapps ${f.movieListMiniAppPgkName} -d ${androidNativeApplicationDescriptor}`,
);

run(`cauldron get nativeapp ${androidNativeApplicationDescriptor}`);

// Del jsapiimpls
run(
  `cauldron del jsapiimpls ${f.movieApiImplJsPkgName}@${f.movieApiImplJsPkgVersion} -d ${androidNativeApplicationDescriptor}`,
);

// Del nativeapp
run(`cauldron del nativeapp ${androidNativeApplicationDescriptor}`);

run(
  `compat-check -m ${f.movieListMiniAppPgkName}@${f.movieListMiniAppPkgVersion} -d ${iosNativeApplicationDescriptor}`,
);
run(`upgrade-miniapp`);

process.chdir(workingDirectoryPath);

// api
run(`create-api ${f.invalidElectrodeNativeModuleName} --skipNpmCheck`, {
  expectedExitCode: 1,
});

// Platform commands
run('platform versions');
run('platform plugins list');
run('platform plugins search react-native');
run('platform config set keyNotSupported trace', { expectedExitCode: 1 });
try {
  run('platform config set tmp-dir "~/dir/to/command/exec"');
  run('platform config set retain-tmp-dir false');
  run('platform config set package-cache-enabled true');
  run('platform config set max-package-cache-size 1024');
  run('platform config set codePushAccessKey "keytocodepush"');
} finally {
  // Clean Cauldron test env
  afterAll();
  // Restore original config
  fs.writeFileSync(
    ERN_RC_GLOBAL_FILE_PATH,
    JSON.stringify(ernConfigObj, null, 2),
  );
}
