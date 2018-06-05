import { shell } from 'ern-core'
import { ContainerGeneratorConfig } from './types'
import fs from 'fs'
import path from 'path'

export function prepareDirectories(conf: ContainerGeneratorConfig) {
  if (!fs.existsSync(conf.outDir)) {
    shell.mkdir('-p', conf.outDir)
  } else {
    shell.rm('-rf', path.join(conf.outDir, '{.*,*}'))
  }

  if (!fs.existsSync(conf.compositeMiniAppDir)) {
    shell.mkdir('-p', conf.compositeMiniAppDir)
  } else {
    shell.rm('-rf', path.join(conf.compositeMiniAppDir, '{.*,*}'))
  }

  if (!fs.existsSync(conf.pluginsDownloadDir)) {
    shell.mkdir('-p', conf.pluginsDownloadDir)
  } else {
    shell.rm('-rf', path.join(conf.pluginsDownloadDir, '{.*,*}'))
  }
}
