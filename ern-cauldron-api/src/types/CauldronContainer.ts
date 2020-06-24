export interface CauldronContainer {
  miniApps: string[];
  /**
   * MiniApp git branch tracking feature.
   * Introduced in 0.25.0.
   */
  miniAppsBranches?: string[];
  nativeDeps: string[];
  jsApiImpls: string[];
  /**
   * JS API Impls branch tracking feature.
   * Introduced in 0.25.0.
   */
  jsApiImplsBranches?: string[];
  /**
   * The ern version used to generate this Container.
   * Introduced in 0.19.0. Required from this version onward.
   * Kept optional for backward compatibility.
   */
  ernVersion?: string;
}
