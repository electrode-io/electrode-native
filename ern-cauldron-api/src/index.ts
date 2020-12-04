import _CauldronApi from './CauldronApi';
import _EphemeralFileStore from './EphemeralFileStore';
import _InMemoryDocumentStore from './InMemoryDocumentStore';
import _GitFileStore from './GitFileStore';
import _GitDocumentStore from './GitDocumentStore';
import { CauldronRepositories } from './CauldronRepositories';

export { CauldronHelper } from './CauldronHelper';

export const CauldronApi = _CauldronApi;
export const EphemeralFileStore = _EphemeralFileStore;
export const InMemoryDocumentStore = _InMemoryDocumentStore;
export const GitFileStore = _GitFileStore;
export const GitDocumentStore = _GitDocumentStore;

export * from './types';
export * from './getActiveCauldron';

export {
  getSchemaVersionMatchingCauldronApiVersion,
  getCurrentSchemaVersion,
  cauldronFileUriScheme,
} from './util';

export { CauldronRepositories } from './CauldronRepositories';
export const cauldronRepositories = new CauldronRepositories();
