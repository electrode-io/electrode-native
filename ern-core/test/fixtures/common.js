import os from 'os';

export const pkgNameUnpublished = 'zxc-pkg-not-in-npm-bnm';
export const pkgNamePublished = 'lodash';
export const pkgName = 'chai';
export const pkgNameWithVersion = 'chai@4.1.2';
export const pkgNameWithInvalidVersion = 'chai@1000.1000.0';
export const moduleTypeNotSupported = 'moduleTypeNotSupported';
export const deviceOne = 'emulator-5554\tdevice';
export const deviceTwo = '8XV7N16516003608\tdevice';
export const multipleAvdList = ['Nexus6API23M', 'Nexus_5X_API_24'];
export const oneAvdList = ['Nexus6API23M'];
export const oneAvd = 'Nexus6API23M';
export const activityName = 'ChaiActivity';
export const projectPath = 'projectPath';
export const getDeviceResult = `List of devices attached${os.EOL}emulator-5554\tdevice${os.EOL}8XV7N16516003608\tdevice`;
export const oneUdid = 'A1213FE6-BDA8-424B-972C-4EA0480C3497';

export const validElectrodeNativeModuleNames = [
  'MyApp',
  'myApi',
  'helloworld',
  'MYAPIIMPLEMENTATION',
  'hell0w0rld',
  '_my_app',
  'my_app',
  'my-app',
  'my-api',
];

export const invalidElectrodeNativeModuleNames = [
  '-invalid',
  '1nvalid',
  'my*app',
  'my$app',
];
