import { utils as coreUtils } from 'ern-core';

export const tryCatchWrap = (
  fn: (args: any) => Promise<void>,
): ((args: any) => Promise<void>) => {
  return async args => {
    try {
      await fn(args);
    } catch (e) {
      coreUtils.logErrorAndExitProcess(e);
    }
  };
};
