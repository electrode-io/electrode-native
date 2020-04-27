import CauldronApi from './CauldronApi';
import GitFileStore from './GitFileStore';
import GitDocumentStore from './GitDocumentStore';

export function defaultCauldron({
  repository,
  cauldronPath,
  branch = 'master',
}: {
  repository?: string;
  cauldronPath: string;
  branch: string;
}) {
  const fileStore = new GitFileStore({
    branch,
    cauldronPath,
    repository,
  });
  const documentStore = new GitDocumentStore({
    branch,
    cauldronPath,
    repository,
  });
  return new CauldronApi(documentStore, fileStore);
}
