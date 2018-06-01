import {
  ContainerPublisher,
  ContainerPublisherConfig,
} from 'ern-container-publisher'
import { createTmpDir, gitCli, shell, log, NativePlatform } from 'ern-core'
import path from 'path'

export default class GitPublisher implements ContainerPublisher {
  get name(): string {
    return 'git'
  }

  get platforms(): NativePlatform[] {
    return ['android', 'ios']
  }

  public async publish({
    containerPath,
    containerVersion,
    url,
  }: {
    containerPath: string
    containerVersion: string
    url?: string
  }) {
    const workingGitDir = createTmpDir()

    if (!url) {
      throw new Error('url is required')
    }

    try {
      shell.pushd(workingGitDir)
      const git = gitCli()
      log.debug(`Cloning git repository(${url}) to ${workingGitDir}`)
      await gitCli().cloneAsync(url, '.')
      shell.rm('-rf', `${workingGitDir}/*`)
      shell.cp('-Rf', path.join(containerPath, '{.*,*}'), workingGitDir)
      await git.addAsync('./*')
      await git.commitAsync(`Container v${containerVersion}`)
      await git.tagAsync([`v${containerVersion}`])
      await git.pushAsync('origin', 'master')
      await git.pushTagsAsync('origin')
      log.info('[=== Completed publication of the Container ===]')
      log.info(`[Publication url : ${url}]`)
      log.info('[Git Branch: master]')
      log.info(`[Git Tag: v${containerVersion}]`)
    } finally {
      shell.popd()
    }
  }
}
