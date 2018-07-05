import CauldronApi from './CauldronApi'
import GitFileStore from './GitFileStore'
import GitDocumentStore from './GitDocumentStore'

export function defaultCauldron({
  repository,
  cauldronPath,
  branch = 'master',
}: {
  repository?: string
  cauldronPath: string
  branch: string
}) {
  const yarnlockStore = new GitFileStore({
    branch,
    cauldronPath,
    prefix: 'yarnlocks',
    repository,
  })
  const bundleStore = new GitFileStore({
    branch,
    cauldronPath,
    prefix: 'bundles',
    repository,
  })
  const dbStore = new GitDocumentStore({
    branch,
    cauldronPath,
    repository,
  })
  return new CauldronApi(dbStore, yarnlockStore, bundleStore)
}
