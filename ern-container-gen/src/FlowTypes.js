// @flow

import {
  Dependency,
  MiniApp
} from 'ern-core'

export type ContainerGeneratorPaths = {
  // Where we assemble the miniapps together
  compositeMiniApp: string;
  // Where we download plugins
  pluginsDownloadDirectory: string;
  // Where we output final generated container
  outDirectory: string;
}

export interface ContainerGenerator {
  generateContainer (
    containerVersion: string,
    nativeAppName: string,
    plugins: Array<Dependency>,
    miniapps: Array<MiniApp>,
    paths: ContainerGeneratorPaths,
    mustacheView: any, {
      pathToYarnLock?: string
    }) : Promise<*>;

  +name : string;
  +platform: string;
}

// @flow
export interface Publisher {
  publish(any): any;
  + name: string;
  + url: string
}
