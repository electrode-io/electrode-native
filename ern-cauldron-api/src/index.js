import GitStore from './gitstore';
import FileStore from './filestore';
import Api from './api';

export default function factory(repository, branch, ernPath) {
    const sourcemapStore = new FileStore(ernPath, repository, branch, 'sourcemaps');
    const binaryStore = new FileStore(ernPath, repository, branch, 'binaries');
    const dbStore = new GitStore(ernPath, repository, branch);
    return new Api(dbStore, binaryStore, sourcemapStore);
};