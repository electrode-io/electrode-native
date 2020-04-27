import { CauldronStartCommandConfigAndroid } from './CauldronStartCommandConfigAndroid';
import { CauldronStartCommandConfigIos } from './CauldronStartCommandConfigIos';

export interface CauldronStartCommandConfig {
  android?: CauldronStartCommandConfigAndroid;
  ios?: CauldronStartCommandConfigIos;
}
