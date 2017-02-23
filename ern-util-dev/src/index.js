import {expect, assert} from 'chai';
import _tmp from 'tmp';
import fs from 'fs';
import {exec} from 'child_process';
import dirCompare from 'dir-compare';
import path from 'path';
import shell from 'shelljs';

const BABEL_HOOK = path.resolve(__dirname, '..', 'babelhook');
const CLI = path.resolve(__dirname, '..', '..', 'ern-local-cli', 'src', 'launchbin.js');


/**
 * Sets up an environment for tests.
 *
 * @param workingCwd - It tries to resolve your test directory.  You are better off passing __dirname from your test
 * so that it will work regardless of the directory it is invoked.  This is a best guess and should work most times.
 * @param - excludeFilter - a function that will pass in an object and exclude it if the function returns true.  Used when doing a compare
 * @param - log - a function for logging.
 * @returns {*}
 */
const EMPTY_FUNC = () => {
};
const excludeFilterRe = /node_modules(\/|$)|yarn\.lock|gradle\.build|API\.xcodeproj/;
const _excludeFilter = ({name1, name2, relativePath}) => excludeFilterRe.test(relativePath) || excludeFilterRe.test(name2) || excludeFilterRe.test(name1);

export default function setup(workingCwd = path.join(process.cwd(), 'test'), log = EMPTY_FUNC) {
    let tmpDir, clean;


    const runBefore = function () {
        return new Promise((resolve, reject) => _tmp.dir({
            mode: '0750',
            keep: true,
            prefix: 'ern_test'
        }, (e, _tmpDir, _clean) => {
            if (e) return reject(e);
            api.log(`tmpDir`, _tmpDir, '\n\n');
            tmpDir = _tmpDir;
            clean = _clean;
            resolve();
        }));
    };

    const runAfter = function (done) {
        tmpDir && shell.rm('-rf', tmpDir);
        return done();
    };

    const cwd = (...args) => path.resolve(tmpDir, ...args);
    const compare = (src, dest, excludeFilter = _excludeFilter) => () => {
        dest = path.join(workingCwd, dest);
        src = api.cwd(src);

        if (!fs.existsSync(dest)) {
            shell.mkdir('-p', path.join(dest, '..'));
            shell.cp('-r', src, dest);
            return Promise.resolve(true);
        } else {
            return dirCompare.compare(src, dest, {
                compareDate: false,
                dateTolerance: 500000,
                compareContent: true
            }).then(({diffSet}) => {
                for (const diff of diffSet) {
                    if (!excludeFilter(diff) && diff.state != 'equal') {
                        assert('Not the same ', (diff.name1 || diff.name2 || diff.relativePath || diff), diff.name1, diff.name2);
                    }
                }
                return true;
            });
        }
    };
    const exists = (file) => () => assert(fs.existsSync(api.cwd(file)), `Expected "${file}" to exist`);
    const gradle = (project, cmd = 'build') => () => new Promise((resolve, reject) => {
        exec(`${api.cwd(project, 'android', 'gradlew')} ${cmd}`, {cwd: api.cwd(project, 'android')}, (err, stdout, stderr) => {
            if (err) return reject(err);
            /BUILD SUCCESSFUL/.test(stdout);
            resolve();
        });
    });

    const json = (file, _test) => () => {
        assert(fs.existsSync(api.cwd(file)), `File should exist ${file}`);
        const ret = JSON.parse(fs.readFileSync(api.cwd(file), 'utf8'));
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

    const ern = (str, options, thens = []) => {
        const f = () => {
            let p = new Promise(function (resolve, reject) {
                const ex = [process.argv[0], '-r', BABEL_HOOK, CLI, str].join(' ');
                api.log(ex);
                exec(ex, Object.assign({
                    cwd: api.cwd(options.cwd),
                    stdio: 'ignore'
                }, options), (err, stdout, stderr) => {
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
            return api.ern(this.test.title, options, thens)();
        }

        f.then = (...args) => {
            thens.push(args);
            return f;
        };
        return f;
    };
    const api = {
        log,
        runBefore,
        runAfter,
        ern,
        gradle,
        compare,
        exists,
        json,
        has,
        cwd,
        ernTest,
        fail(message = `This should fail if executed`){
            return () => {
                throw new Error(message)
            };
        }
    };
    return api;
}
