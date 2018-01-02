// @flow

import Dependency from './Dependency'
import DependencyPath from './DependencyPath'
import spin from './spin'
import MiniApp from './MiniApp'
import _ from 'lodash'

export async function getMiniAppsUsingNativeDependency (
  miniAppsPaths: Array<DependencyPath>,
  nativeDependency: Dependency
) : Promise<Array<MiniApp>> {
  let result = []
  const nativeDependencyString = nativeDependency.withoutVersion().toString()
  for (const miniAppPath of miniAppsPaths) {
    const miniApp = await spin(`Retrieving ${miniAppPath.toString()} for dependency lookup`, MiniApp.fromPackagePath(miniAppPath))
    const miniAppNativeDependencies = await miniApp.getNativeDependencies()
    const miniAppNativeDependenciesStrings = _.map(miniAppNativeDependencies.all, d => d.withoutVersion().toString())
    if (miniAppNativeDependenciesStrings.includes(nativeDependencyString)) {
      result.push(miniApp)
    }
  }
  return result
}
