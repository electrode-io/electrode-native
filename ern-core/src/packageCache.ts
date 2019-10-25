import { FsCache } from './FsCache'
import { PackagePath } from './PackagePath'
import { yarn } from './clients'
import config from './config'
import Platform from './Platform'
import shell from './shell'
import path from 'path'
import { readPackageJson } from './packageJsonFileUtils'

/**
 * Singleton instance of a file system based cache dealing
 * with caching Packages
 */
export const packageCache = new FsCache<PackagePath>({
  addObjectToCacheDirectory: async (obj: PackagePath, dirPath: string) => {
    try {
      shell.pushd(dirPath)
      await yarn.init()
      await yarn.add(obj)
      const packageJson = await readPackageJson('.')
      const packageName = Object.keys(packageJson.dependencies)[0]
      shell.rm('package.json')
      shell.mv(path.join('node_modules', packageName, '*'), '.')
    } finally {
      shell.popd()
    }
  },
  maxCacheSize: config.get('max-package-cache-size'),
  objectToId: (obj: PackagePath) => obj.fullPath,
  rootCachePath: Platform.packagesCacheDirectory,
})
