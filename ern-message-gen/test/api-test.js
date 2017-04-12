import DefaultGenerator from "../src/DefaultGenerator";
import path from "path";
import shell from 'shelljs';
import ernUtilDev from "@walmart/ern-util-dev";
import {CONFIG} from '../src/java/Logger';
import File from "../src/java/File";
import {execSync} from 'child_process';
import CodegenConfigurator from '../src/config/CodegenConfigurator';
import Langs from '../src/cmd/Langs';
import fs from 'fs';

CONFIG.LEVEL = 0;

describe('api schemas', function () {
    this.timeout(50000);

    const {compare, runBefore, cwd, runAfter} = ernUtilDev(__dirname, true);

    before(runBefore);
    after(runAfter);
    function generate(inputSpec, lang, outputDir, extra = {}) {
        return generateObj({inputSpec, lang, outputDir, ...extra});
    }

    const generateObj = function (config) {
        const thens = [];
        const f = async function () {
            const outputDir = cwd(config.outputDir);
            const tmpFile = new File(outputDir);
            if (tmpFile.exists()) {
                shell.rm('-rf', tmpFile);
            }

            tmpFile.mkdirs();
            config.inputSpec = path.join(__dirname, 'fixtures', config.inputSpec);
            config.outputDir = outputDir;
            config.bridgeVersion = '1.0.0';
            const cc = new CodegenConfigurator(config);

            const opts = await cc.toClientOptInput();
            const d = new DefaultGenerator().opts(opts);
            try {
                d.generate();
                for (const [success] of thens) {
                    await success();
                }
            } catch (e) {
                console.trace(e);
                if (!thens || thens.length == 0) throw e;
                for (const [s, fail] of thens) {
                    if (fail) {
                        fail(e);
                    } else {
                        throw e;
                    }
                }

            }

        };
        f.then = (...args) => {
            thens.push(args);
            return f;
        };

        return f;
    };

    function npm(command, dir) {
        return function () {
            return execSync(`npm ${command}`, {cwd: cwd(dir), stdio: [process.stdin, process.stdout, process.stderr]});
        }
    }

    const specs = fs.readdirSync(path.join(__dirname, 'fixtures', 'apis'));
    const langs = Langs.langs();
    for (const lang of langs) {
        describe(lang, function () {
            for (const inputSpec of specs) {
                it(`apis should generate '${inputSpec}' for '${lang}'`, generateObj({
                    inputSpec: `apis/${inputSpec}`,
                    lang,
                    outputDir: `apis/${inputSpec.replace(/\./, '_')}/${lang}`
                }));
            }
        })

    }
    /*it(`should generate 'analytics.json' for 'ES6ERN'`, generateObj({
        inputSpec: `apis/analytics.json`,
        lang: 'ERNES6',
        outputDir: `analytics_json`
    }));*/
});
