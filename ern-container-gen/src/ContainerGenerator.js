// @flow

import {
  Dependency
} from 'ern-util'
import {
  MiniApp
} from 'ern-core'

export interface ContainerGenerator {
  generateContainer (
    containerVersion: string,
    nativeAppName: string,
    plugins: Array<Dependency>,
    miniapps: Array<MiniApp>,
    paths: any,
    mustacheView: any, {
      pathToYarnLock?: string
    }) : Promise<*>;

  +name : string;
  +platform: string;
}
