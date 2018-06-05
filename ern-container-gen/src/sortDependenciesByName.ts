import { PackagePath } from 'ern-core'

export function sortDependenciesByName(dependencies: PackagePath[]) {
  return dependencies.sort((a, b) => {
    if (a.basePath < b.basePath) {
      return -1
    }
    if (a.basePath > b.basePath) {
      return 1
    }
    return 0
  })
}
