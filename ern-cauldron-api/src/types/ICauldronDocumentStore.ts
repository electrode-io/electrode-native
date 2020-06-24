import { ITransactional } from './ITransactional';
import { ICauldronDocumentAccess } from './ICauldronDocumentAccess';

export type ICauldronDocumentStore = ITransactional & ICauldronDocumentAccess;
