export interface ContainerGeneratorPaths {
  /**
   * Where we assemble the miniapps together
   */
  compositeMiniApp: string
  /**
   * Where we download plugins
   */
  pluginsDownloadDirectory: string
  /**
   * Where we output final generated container
   */
  outDirectory: string
}
