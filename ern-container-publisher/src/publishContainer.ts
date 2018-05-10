import { ContainerPublisherConfig } from './types'
import GithubPublisher from './publishers/GithubPublisher'
import MavenPublisher from './publishers/MavenPublisher'
import JcenterPublisher from './publishers/JcenterPublisher'
import { createTmpDir, gitCli, shell, log } from 'ern-core'
import path from 'path'

export default async function publishContainer(conf: ContainerPublisherConfig) {
  // Duplicate the directory containing generated Container to a temporary
  // directory, and pass this temporary directory to the publisher.
  // This is done because Container generation and publication are
  // clearly distinct (separation of concerns), we don't want the publisher
  // to update the Container generated code for its publication needs.
  // It also ensures that this function can be called multiple times
  // with different publishers for the same Container (idempotent).
  // Otherwise, if publication changes were made to the original Container
  // path, it would be much harder to use a different publisher for the
  // same Container.
  const publicationWorkingDir = createTmpDir()
  shell.cp(
    '-Rf',
    path.join(conf.containerPath, '{.*,*}'),
    publicationWorkingDir
  )
  conf.containerPath = publicationWorkingDir

  // Instantiates a Container publisher based on it's name and call
  // publish fumction to trigger Container publication
  switch (conf.publisherName) {
    case 'github':
      return new GithubPublisher().publish(conf)
    case 'maven':
      return new MavenPublisher().publish(conf)
    case 'jcenter':
      return new JcenterPublisher().publish(conf)
    default:
      throw new Error(`Unsupported Container publisher : ${conf.publisherName}`)
  }
}
