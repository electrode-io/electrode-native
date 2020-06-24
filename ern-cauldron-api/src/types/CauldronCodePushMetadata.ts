export interface CauldronCodePushMetadata {
  deploymentName: string;
  isMandatory?: boolean;
  isDisabled?: boolean;
  appVersion?: string;
  size?: number;
  releaseMethod?: string;
  label?: string;
  releasedBy?: string;
  rollout?: number;
  promotedFromLabel?: string;
  description?: string;
}
