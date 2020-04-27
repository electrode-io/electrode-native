import { getActiveCauldron } from 'ern-cauldron-api';
import { ErnBinaryStore } from 'ern-core';

export async function getBinaryStoreFromCauldron(): Promise<ErnBinaryStore> {
  const cauldron = await getActiveCauldron();
  const binaryStoreConfig = await cauldron.getBinaryStoreConfig();
  if (!binaryStoreConfig) {
    throw new Error('No binary store configuration was found in Cauldron');
  }
  return new ErnBinaryStore(binaryStoreConfig);
}
