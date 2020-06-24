//
// This file contains any Mocha root level hooks
// which should be run for any test cases regardless
// of the file they live in.

import shell from '../src/shell';
import log from '../src/log';
import { LogLevel } from '../src/coloredLog';
import kax from '../src/kax';
import { KaxRenderer, KaxTask } from 'kax';

class KaxNullRenderer implements KaxRenderer {
  public renderWarning(msg: string) {
    // noop
  }
  public renderInfo(msg: string) {
    // noop
  }
  public renderError(msg: string) {
    // noop
  }
  public renderRaw(msg: string) {
    // noop
  }
  public renderTask<T>(msg: string, task: KaxTask<T>) {
    // noop
  }
}

//
// Before any test suite is run
before(() => {
  // Disable shell commands logging
  shell.config.verbose = false;
  shell.config.silent = true;
  // Disable base logging (log.)
  log.setLogLevel(LogLevel.Off);
  // Disable kax logging (kax.)
  kax.renderer = new KaxNullRenderer();
});
