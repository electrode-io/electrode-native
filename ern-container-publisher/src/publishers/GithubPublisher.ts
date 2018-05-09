import { ContainerPublisher, ContainerPublisherConfig } from '../types'
import { createTmpDir, gitCli, shell, log } from 'ern-core'
import path from 'path'

export default class GithubPublisher implements ContainerPublisher {
  get name(): string {
    return 'github'
  }

  public async publish(config: ContainerPublisherConfig) {
    const workingGitDir = createTmpDir()

    if (!config.url) {
      throw new Error('url is required for GitHub publisher')
    }

    try {
      shell.pushd(workingGitDir)
      const git = gitCli()
      log.debug(`Cloning git repository(${config.url}) to ${workingGitDir}`)
      await gitCli().cloneAsync(config.url, '.')
      shell.rm('-rf', `${workingGitDir}/*`)
      shell.cp('-Rf', path.join(config.containerPath, '{.*,*}'), workingGitDir)
      await git.addAsync('./*')
      await git.commitAsync(`Container v${config.containerVersion}`)
      await git.tagAsync([`v${config.containerVersion}`])
      await git.pushAsync('origin', 'master')
      await git.pushTagsAsync('origin')
      log.info('[=== Completed publication of the Container ===]')
      log.info(`[Publication url : ${config.url}]`)
      log.info('[Git Branch: master]')
      log.info(`[Git Tag: v${config.containerVersion}]`)
    } finally {
      shell.popd()
    }
  }
}
