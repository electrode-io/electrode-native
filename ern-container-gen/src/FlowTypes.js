// @flow

import {
  Dependency
} from 'ern-util'
import {
  MiniApp
} from 'ern-core'

export type ContainerGeneratorPaths = {
  // Where the container project hull is stored
  containerHull: string;
  // Where the templates to be used during container generation are stored
  containerTemplates: string;
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
