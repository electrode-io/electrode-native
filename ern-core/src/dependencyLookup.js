// @flow

import PackagePath from './PackagePath'
import spin from './spin'
import MiniApp from './MiniApp'
import _ from 'lodash'

export async function getMiniAppsUsingNativeDependency (
  miniAppsPaths: Array<PackagePath>,
  nativeDependency: PackagePath
) : Promise<Array<MiniApp>> {
  let result = []
  const nativeDependencyString = nativeDependency.basePath
  for (const miniAppPath of miniAppsPaths) {
    const miniApp = await spin(`Retrieving ${miniAppPath.toString()} for dependency lookup`, MiniApp.fromPackagePath(miniAppPath))
    const miniAppNativeDependencies = await miniApp.getNativeDependencies()
    const miniAppNativeDependenciesStrings = _.map(miniAppNativeDependencies.all, d => d.basePath)
    if (miniAppNativeDependenciesStrings.includes(nativeDependencyString)) {
      result.push(miniApp)
    }
  }
  return result
}
