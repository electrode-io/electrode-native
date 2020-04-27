import { Cauldron } from './Cauldron';

export interface ICauldronDocumentAccess {
  commit(message: string): Promise<void>;
  getCauldron(): Promise<Cauldron>;
}
