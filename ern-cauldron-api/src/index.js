import Gitstore from './gitstore';
import Filestore from './filestore';
import Api from './api';

export default function factory(repository, branch, ernPath) {
    const sourcemapStore = new Filestore(ernPath, repository, branch, 'sourcemaps');
    const binaryStore = new Filestore(ernPath, repository, branch, 'binaries');
    const dbStore = new Gitstore(ernPath, repository, branch);
    return new Api(dbStore, binaryStore, sourcemapStore);
};