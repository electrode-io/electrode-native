import { PackagePath } from './PackagePath'
import kax from './kax'
import { MiniApp } from './MiniApp'
import _ from 'lodash'

export async function getMiniAppsUsingNativeDependency(
  miniAppsPaths: PackagePath[],
  nativeDependency: PackagePath
): Promise<MiniApp[]> {
  const result: MiniApp[] = []
  const nativeDependencyString = nativeDependency.name!
  for (const miniAppPath of miniAppsPaths) {
    const miniApp = await kax
      .task(`Retrieving ${miniAppPath.toString()} for dependency lookup`)
      .run(MiniApp.fromPackagePath(miniAppPath))
    const miniAppNativeDependencies = await miniApp.getNativeDependencies()
    const miniAppNativeDependenciesStrings = _.map(
      miniAppNativeDependencies.all,
      d => d.name!
    )
    if (miniAppNativeDependenciesStrings.includes(nativeDependencyString)) {
      result.push(miniApp)
    }
  }
  return result
}
