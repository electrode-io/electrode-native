// @flow
import type {
  ContainerPublisher,
  ContainerPublisherConfig
} from '../FlowTypes'
import {
  gitCli,
  shell
} from 'ern-core'
import tmp from 'tmp'
import path from 'path'

export default class GithubPublisher implements ContainerPublisher {
  get name (): string {
    return 'github'
  }

  async publish (config: ContainerPublisherConfig) {
    const workingDir = tmp.dirSync({ unsafeCleanup: true }).name

    try {
      shell.pushd(workingDir)
      const git = gitCli()
      log.debug(`Cloning git repository(${config.url}) to ${workingDir}`)
      await gitCli().cloneAsync(config.url, '.')
      shell.rm('-rf', `${workingDir}/*`)
      shell.cp('-Rf', path.join(config.containerPath, '{.*,*}'), workingDir)
      await git.addAsync('./*')
      await git.commitAsync(`Container v${config.containerVersion}`)
      await git.tagAsync([`v${config.containerVersion}`])
      await git.pushAsync('origin', 'master')
      await git.pushTagsAsync('origin')
    } finally {
      shell.popd()
    }
  }
}
