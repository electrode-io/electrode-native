import { CauldronContainer } from './CauldronContainer';
import { CauldronObject } from './CauldronObject';
import { CauldronCodePushEntry } from './CauldronCodePushEntry';

export interface CauldronNativeAppVersion extends CauldronObject {
  isReleased: boolean;
  binary?: string;
  yarnLocks: any;
  container: CauldronContainer;
  codePush: { [deploymentName: string]: CauldronCodePushEntry[] };
  containerVersion: string;
  description?: string;
}
