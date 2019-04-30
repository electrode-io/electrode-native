import { log, PackagePath, GitHubApi } from 'ern-core'
import { getActiveCauldron } from 'ern-cauldron-api'

export async function getGitHubApi({
  owner,
  repo,
}: {
  owner: string
  repo: string
}) {
  if (!process.env.ERN_GITHUB_TOKEN) {
    throw new Error('ERN_GITHUB_TOKEN environment variable must be set')
  }
  const cauldron = await getActiveCauldron()
  const gitHubConfig = await cauldron.getGitHubConfig()
  const opts: any = {
    auth: `token ${process.env.ERN_GITHUB_TOKEN}`,
  }
  if (gitHubConfig && gitHubConfig.baseUrl) {
    opts.baseUrl = gitHubConfig.baseUrl
  }
  return new GitHubApi({
    opts,
    owner,
    repo,
  })
}

export async function createBranch({
  name,
  packages,
}: {
  name: string
  packages: PackagePath[]
}) {
  return createBranchOrTag({ name, packages, type: 'branch' })
}

export async function createTag({
  name,
  packages,
}: {
  name: string
  packages: PackagePath[]
}) {
  return createBranchOrTag({ name, packages, type: 'tag' })
}

export async function createBranchOrTag({
  name,
  packages,
  type,
}: {
  name: string
  packages: PackagePath[]
  type: 'branch' | 'tag'
}) {
  for (const pkg of packages) {
    if (!pkg.isGitPath) {
      log.info(`Skipping ${pkg.basePath} [not git based]`)
      continue
    }
    const opts: any = { name }
    const { owner, repo } = extractGitData(pkg)
    const api = await getGitHubApi({ owner, repo })
    const refExist =
      type === 'branch' ? await api.isBranch(name) : await api.isTag(name)
    if (refExist) {
      log.warn(`Skipping ${pkg.basePath} [${name} ${type} already exist]`)
      continue
    }
    if (pkg.version) {
      if (await api.isSha(pkg.version)) {
        opts.fromSha = pkg.version
      } else if (await api.isBranch(pkg.version)) {
        opts.fromBranch = pkg.version
      } else if (await api.isTag(pkg.version)) {
        opts.fromTag = pkg.version
      } else {
        throw new Error(
          `${pkg.version} is not a valid git ref of ${pkg.basePath}`
        )
      }
    }
    if (type === 'branch') {
      await api.createBranch(opts)
    } else {
      await api.createTag(opts)
    }

    log.info(`Created ${type} ${name} from ${pkg.version} in ${pkg.basePath}`)
  }
}

function extractGitData(p: PackagePath) {
  if (!p.isGitPath) {
    throw new Error('Not a git package path !')
  }

  const [, owner, repo] = p.basePath.startsWith('https')
    ? /^https:\/\/[^\/]+\/([^\/]+)\/(.+).git$/.exec(p.basePath)!
    : /^git\+ssh:\/\/[^\/]+\/([^\/]+)\/(.+).git$/.exec(p.basePath)!

  return {
    owner,
    repo,
    version: p.version,
  }
}
