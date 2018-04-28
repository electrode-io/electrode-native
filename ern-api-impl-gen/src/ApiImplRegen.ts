import ApiImplGen from './generators/ApiImplGen'
import { PackagePath, log } from 'ern-core'

export default async function regenerateApiImpl({
  api,
  paths,
  reactNativeVersion,
  platforms,
}: {
  api: PackagePath
  paths: any
  reactNativeVersion: string
  platforms: string[]
}) {
  try {
    await new ApiImplGen().generateApiImplementation(
      api,
      paths,
      reactNativeVersion,
      platforms,
      true
    )
  } catch (e) {
    throw e
  }
}
