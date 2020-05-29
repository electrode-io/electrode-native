import { GitHubApi, log, manifest, PackagePath } from 'ern-core'
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

export async function deleteBranch({
  name,
  packages,
}: {
  name: string
  packages: PackagePath[]
}) {
  return deleteBranchOrTag({ name, packages, type: 'branch' })
}

export async function deleteTag({
  name,
  packages,
}: {
  name: string
  packages: PackagePath[]
}) {
  return deleteBranchOrTag({ name, packages, type: 'tag' })
}

export async function deleteBranchOrTag({
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
    if (!refExist) {
      log.warn(
        `Skipping ${pkg.basePath} [${name} ${type} as it does not exist]`
      )
      continue
    }
    if (type === 'branch') {
      await api.deleteBranch(opts)
    } else {
      await api.deleteTag(opts)
    }

    log.info(`Deleted ${type} ${name} from ${pkg.basePath}`)
  }
}

export async function alignPackageJsonOnManifest({
  manifestId,
  packages,
}: {
  manifestId: string
  packages: PackagePath[]
}) {
  for (const pkg of packages) {
    if (!pkg.isGitPath) {
      log.debug(`Skipping ${pkg.basePath} [not git based]`)
      continue
    }
    log.info(`Aligning dependencies of ${pkg.basePath}`)
    const { owner, repo } = extractGitData(pkg)
    const gitHubApi = await getGitHubApi({
      owner,
      repo,
    })
    const res = await gitHubApi.getFileContent({
      fromBranch: pkg.version,
      path: 'package.json',
    })
    const jsonRes: any = JSON.parse(res)
    const wasUpdated = await updatePackageJson({
      manifestId,
      packageJson: jsonRes,
    })
    if (!wasUpdated) {
      log.info(
        `All dependencies of ${pkg.toString()} are already aligned. Skipping.`
      )
    } else {
      const newContent = JSON.stringify(jsonRes, null, 2)
      await gitHubApi.updateFileContent({
        commitMessage: `Align dependencies on ${manifestId} manifest id`,
        newContent,
        onBranch: pkg.version,
        path: 'package.json',
      })
      log.info(`Successfully aligned dependencies of ${pkg.basePath}.`)
    }
  }
}

async function updatePackageJson({
  manifestId,
  packageJson,
}: {
  manifestId: string
  packageJson: any
}): Promise<boolean> {
  let wasUpdated = false

  const manifestDependencies = await manifest.getJsAndNativeDependencies({
    manifestId,
  })

  for (const manifestDependency of manifestDependencies) {
    if (packageJson.dependencies[manifestDependency.basePath]) {
      const dependencyManifestVersion = manifestDependency.version
      const localDependencyVersion =
        packageJson.dependencies[manifestDependency.basePath]
      if (dependencyManifestVersion !== localDependencyVersion) {
        log.info(
          `${manifestDependency.basePath} : ${localDependencyVersion} => ${dependencyManifestVersion}`
        )
        packageJson.dependencies[
          manifestDependency.basePath
        ] = dependencyManifestVersion
        wasUpdated = true
      }
    }
  }

  return wasUpdated
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
