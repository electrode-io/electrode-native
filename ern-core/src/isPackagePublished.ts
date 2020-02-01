import { yarn } from './clients'
import { PackagePath } from './PackagePath'

export async function isPackagePublished(
  packageName: string
): Promise<boolean> {
  try {
    await yarn.info(PackagePath.fromString(packageName), {
      field: 'versions',
    })
    return true
  } catch (e) {
    // If the package name doesn't exist in the NPM registry, Do nothing
    // {"type":"error","data":"Received invalid response from npm."}
  }
  return false
}
