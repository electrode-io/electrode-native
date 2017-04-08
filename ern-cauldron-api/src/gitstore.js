import path from 'path'
import {writeJSON, readJSON, ensureDir, writeFile} from './fs-util';
import fs from 'fs';
import BaseGit from './base-git';
const ERN_PATH = path.resolve(process.env['HOME'], '.ern');

export default class GitStore extends BaseGit {

    constructor(ernPath = ERN_PATH, repository, branch = 'master', cauldron = {
        "nativeApps": [],
        "reactNativeApps": []
    }) {
        super(ernPath, repository, branch);
        this._jsonPath = path.resolve(this.path, 'cauldron.json');
        this.cauldron = cauldron;
    }

    async commit(message = 'Commit') {
        await this._ensure();
        await writeJSON(this._jsonPath, this.cauldron);
        const git = this.git();
        await git.add('cauldron.json');
        await git.commit(message);
        await this._push(git)

    }

    //check and sync;
    async begin() {
        await this._ensure();
        if (fs.existsSync(this._jsonPath)) {
            this.cauldron = await readJSON(this._jsonPath);
        }
    }
}
