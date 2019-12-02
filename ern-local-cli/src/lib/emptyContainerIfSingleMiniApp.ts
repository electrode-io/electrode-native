import { getActiveCauldron } from 'ern-cauldron-api'
import { AppVersionDescriptor } from 'ern-core'

export async function emptyContainerIfSingleMiniApp(
  descriptor: AppVersionDescriptor
): Promise<boolean> {
  const cauldron = await getActiveCauldron()
  const containerMiniApps = await cauldron.getContainerMiniApps(descriptor)
  if (containerMiniApps.length === 1) {
    await cauldron.emptyContainer(descriptor)
    return true
  }
  return false
}
