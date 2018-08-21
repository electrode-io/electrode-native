import { BundlingResult } from 'ern-core'

export interface ContainerGenResult {
  /**
   * Metadata resulting from the bundling
   */
  bundlingResult: BundlingResult
  /**
   * Indicates whether only the JS bundle was generated
   */
  generatedJsBundleOnly: boolean
}
