import {expect, assert} from 'chai';
import _tmp from 'tmp';
import fs from 'fs';
import rimraf from 'rimraf';
import shell from 'shelljs';
import {exec} from 'child_process';
import dirCompare from 'dir-compare';
import path from 'path';

const BABEL_HOOK = path.resolve(__dirname, '..', '..', '..', 'ern-util-dev', 'babelhook');
const CLI = path.resolve(__dirname, '..', '..', 'src', 'launchbin.js');

const nodeModulesRe = /node_modules(\/|$)/;

const excludeFilter = ({name1, name2, relativePath}) => {

    return nodeModulesRe.test(relativePath) || nodeModulesRe.test(name2) || nodeModulesRe.test(name1) || /build\.gradle/.test(name1) || /API\.xcodeproj/.test(relativePath);

};

export default function setup() {
    let tmpDir, clean;

    const runBefore = () => new Promise((resolve, reject) => _tmp.dir({
        mode: '0750',
        keep: true,
        prefix: 'ern_test'
    }, (e, _tmpDir, _clean) => {
        if (e) return reject(e);
        console.log(`tmpDir`, _tmpDir, '\n\n');
        tmpDir = _tmpDir;
        clean = _clean;
        resolve();
    }));

    const runAfter = () => new Promise(resolve => tmpDir ? rimraf(tmpDir, () => resolve()) : resolve());

    const cwd = (...args) => path.resolve(tmpDir, ...args);
    const compare = (src, dest) => () => {
        dest = path.join(__dirname, '..', dest);
        src = cwd(src);

        if (!fs.existsSync(dest)) {
            shell.mkdir('-p', 'fixtures');
            shell.cp('-r', src, dest);
            return Promise.resolve(true);
        } else {
            return dirCompare.compare(src, dest, {
                compareDate: false,
                dateTolerance: 500000,
                compareContent: true
            }).then(({diffSet}) => {
                let ret = true;
                for (const diff of diffSet) {
                    if (!excludeFilter(diff) && diff.state != 'equal') {
                        console.log('Not the same ', diff.name1, diff.name2);
                        ret = false;
                    }
                }
                assert(ret, 'Not the same, see console');
                return ret;
            });
        }
    };
    const exists = (file) => () => assert(fs.existsSync(cwd(file)), `Expected "${file}" to exist`);
    const gradle = (project, cmd = 'build') => () => new Promise((resolve, reject) => {
        exec(`${cwd(project, 'android', 'gradlew')} ${cmd}`, {cwd: cwd(project, 'android')}, (err, stdout, stderr) => {
            if (err) return reject(err);
            /BUILD SUCCESSFUL/.test(stdout);
            resolve();
        });
    });

    const json = (file, _test) => () => {
        assert(fs.existsSync(cwd(file)), `File should exist ${file}`);
        const ret = JSON.parse(fs.readFileSync(cwd(file), 'utf8'));
        if (_test) {
            if (typeof _test === 'function') {
                return _test(ret)
            }
            expect(ret, `Compare to "${file}" `).to.contain(_test);
        }
        return ret;
    };
    const has = (src) => (result) => {
        expect(result).to.contain(src);
        return result;
    };

    const ern = (str, options = {cwd: ''}, thens = []) => {
        const f = () => {
            let p = new Promise(function (resolve, reject) {
                const ex = [process.argv[0], '-r', BABEL_HOOK, CLI, str].join(' ');
                console.log(ex);
                const s = exec(ex, {cwd: cwd(options.cwd), stdio: 'ignore'}, (err, stdout, stderr) => {
                    if (err) {
                        console.error(stderr);
                        return reject({err, stdout, stderr});
                    }
                    resolve({stdout, stderr});
                });

            });
            for (const _then of thens) {
                p = p.then(..._then);
            }
            return p;
        };

        f.then = (..._thens) => {
            thens.push(_thens);
            return f;
        };

        return f;
    };
    //Uses the title of the test to create the ern command.
    const ernTest = (thens = [], options = {cwd: ''}) => {
        function f() {
            return ern(this.test.title, options, thens)();
        }

        f.then = (...args) => {
            thens.push(args);
            return f;
        };
        return f;
    };
    return {
        runBefore,
        runAfter,
        ern,
        gradle,
        compare,
        exists,
        json,
        has,
        ernTest,
        fail(message = `This should fail if executed`){
            return () => {
                throw new Error(message)
            };
        }
    }
}