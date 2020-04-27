import { getActiveCauldron } from 'ern-cauldron-api';
import { AppVersionDescriptor } from 'ern-core';

export async function emptyContainerIfSingleMiniAppOrJsApiImpl(
  descriptor: AppVersionDescriptor,
): Promise<boolean> {
  const cauldron = await getActiveCauldron();
  const containerMiniApps = await cauldron.getContainerMiniApps(descriptor);
  const containerJsApiImpls = await cauldron.getContainerJsApiImpls(descriptor);
  const containerMiniAppsAndJsApiImpls = [
    ...containerJsApiImpls,
    ...containerMiniApps,
  ];
  if (containerMiniAppsAndJsApiImpls.length === 1) {
    await cauldron.emptyContainer(descriptor);
    return true;
  }
  return false;
}
