import config from './config';

export const ANDROID_DEVICE_CONFIG = 'androidDeviceConfig';
export const IOS_DEVICE_CONFIG = 'iOSDeviceConfig';

export function updateDeviceConfig(
  platform: 'ios' | 'android',
  usePreviousDevice: boolean = false,
) {
  const key = platform === 'ios' ? IOS_DEVICE_CONFIG : ANDROID_DEVICE_CONFIG;

  const deviceConfig = config.get(key, {
    deviceId: '',
  });
  deviceConfig.usePreviousDevice = usePreviousDevice;
  config.set(key, deviceConfig);
}
