import { PackagePath } from 'ern-core';

export interface ContainerTransformerConfig {
  /**
   * The transformer to use
   * Can either be
   * - An absolute path to the directory containing the transformer
   * package (mostly to be used for transformer development and testing)
   * - The transformer package to be retrieved from npm registry.
   * In case of a package from a registry  :
   * - If version is omitted, the latest version will be used
   * - If version is specified, the exact version will be used
   */
  transformer: PackagePath;
  /**
   * Local file system path to the generated Container to transform
   */
  containerPath: string;
  /**
   * The platform of the Container to transform
   */
  platform: 'android' | 'ios';
  /**
   * Version of Electrode Native used
   */
  ernVersion?: string;
  /**
   * Optional extra configuration.
   * Specific to the transformer
   */
  extra?: any;
}
