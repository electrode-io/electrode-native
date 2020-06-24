import { ITransactional } from './ITransactional';
import { ICauldronFileAccess } from './ICauldronFileAccess';

export type ICauldronFileStore = ITransactional & ICauldronFileAccess;
