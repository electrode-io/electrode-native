import fs from 'fs';
import path from 'path';

const ERN_PATH = path.join(process.env['HOME'], '.ern');
const ERN_RC_GLOBAL_FILE_PATH = path.join(ERN_PATH, '.ernrc');
const ERN_RC_LOCAL_FILE_PATH = path.join(process.cwd(), '.ernrc');

export class ErnConfig {
    get obj() {
        return JSON.parse(fs.readFileSync(this.ernRcFilePath, 'utf-8'));
    }

    get ernRcFilePath() {
        return fs.existsSync(ERN_RC_LOCAL_FILE_PATH) ?
            ERN_RC_LOCAL_FILE_PATH :
            ERN_RC_GLOBAL_FILE_PATH;
    }

    getValue(key) {
        return this.obj[key];
    }

    setValue(key, value) {
        let c = this.obj;
        c[key] = value;
        fs.writeFileSync(this.ernRcFilePath, JSON.stringify(c));
    }

    writeConfig(obj) {
        fs.writeFileSync(this.ernRcFilePath, JSON.stringify(obj, null, 2));
    }
}
const config = new ErnConfig();

export default config;
