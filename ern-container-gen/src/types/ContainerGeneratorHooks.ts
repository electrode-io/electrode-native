export interface ContainerGeneratorHooks {
  /**
   * Path to script to be executed just after composite generation
   */
  preBundle?: string;
  /**
   * Path to script to be executed just after metro bundler has been run
   */
  postBundle?: string;
}
