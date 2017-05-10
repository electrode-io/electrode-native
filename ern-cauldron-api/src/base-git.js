import simpleGit from 'simple-git';
import path from 'path'
import {ensureDir, writeFile} from './fs-util';
import fs from 'fs';

const ERN_PATH = path.resolve(process.env['HOME'], '.ern');

function trim(v) {
    return v && v.trim();
}

export const settings = {
    README: `Cauldron Repo
    ===
    Please use the ERN cli to manipulate not for general consumption
    `
};

export default class BaseGit {

    constructor(ernPath = ERN_PATH, repository, branch = 'master') {
        this.path = path.resolve(ernPath, 'cauldron');
        this.repository = repository;
        this.branch = branch;
    }

    git() {
        return simpleGit(this.path);
    }

    async _push(git) {
        if (this.repository) {
            git = git || this.git();
            return git.push(['upstream', this.branch]);
        }
        return Promise.reject(new Error('No repository to push to !'))
    }

    async _ensure() {
        await ensureDir(this.path);
        const git = this.git();    
        if (!fs.existsSync(path.resolve(this.path, '.git'))) {
            await git.init()
                     .addRemote('upstream', this.repository);
        }

        await this._setUpstreamRemoteUrl(this.repository)

        await new Promise((resolve, reject) => {
            git.fetch('upstream', 'master', (e, o) => {
                if (e) {
                    if (/Couldn't find remote ref master/.test(e + '')) {
                        console.log(`pull failed try write commit and push`);
                        return this._writeReadme();
                    } else {
                        return reject(typeof e == 'string' ? new Error(e) : e);
                    }
                }
                resolve()
            })
        })

        await git.reset(['--hard', 'upstream/master'])        
    }

    async _setUpstreamRemoteUrl(url) {
        return new Promise((resolve, reject) => {
            this.git().raw(
                [
                    'remote',
                    'set-url',
                    'upstream',
                    url
                ], (err, result) => {
                if (err) {
                    return reject(err)
                }
                resolve(result)
            })
        })
    }

    async _writeReadme() {
        const fpath = path.resolve(this.path, 'README.md');
        if (!fs.existsSync(fpath)) {
            await writeFile(fpath, {encoding: 'utf8'}, settings.README);
            const git = this.git();
            await git.add('README.md');
            await git.commit('First Commit!');
            return this._push(git);
        }
    }
}