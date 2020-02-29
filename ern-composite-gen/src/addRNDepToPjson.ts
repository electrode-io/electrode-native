import { readPackageJson, writePackageJson } from 'ern-core'

export async function addRNDepToPjson(dir: string, version: string) {
  const compositePackageJson = await readPackageJson(dir)
  compositePackageJson.dependencies['react-native'] = version
  return writePackageJson(dir, compositePackageJson)
}
