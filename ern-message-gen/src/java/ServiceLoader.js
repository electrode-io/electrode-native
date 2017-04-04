import fs from "fs";
import path from "path";
import LoggerFactory from "./LoggerFactory";
import File from "./File";
import {isEmpty} from './StringUtils';

const Log = LoggerFactory.getLogger('ServiceLoader');

const tryNewRequire = (mod) => {
    try {
        const Clz = require(mod).default;
        return new Clz();
    } catch (e) {
        Log.warn(`could not require ${mod}`, e);
    }
};
export default ({
    load(className){
        const ret = [];
        const lines = [];
        const meta = new File(__dirname, '..', '..', 'resources', 'META-INF', 'services', className);
        if (!meta.exists()) {
            return ret;
        }
        try {
            lines.push(...fs.readFileSync(meta.getPath(), 'utf8').split('\n'));
        } catch (e) {
            Log.warn(`Error loading ${className}`, e);
            return ret;
        }

        for (const mod of lines) {
            if (isEmpty(mod)) continue;
            const conf = tryNewRequire(path.join(__dirname, '..', ...mod.split('.')));
            if (conf) {
                ret.push(conf);
            }
        }

        return ret;
    }
});