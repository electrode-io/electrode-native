const fs = require('fs');
const ERN_PATH = `${process.env['HOME']}/.ern`;
const ERN_RC_GLOBAL_FILE_PATH = `${ERN_PATH}/.ernrc`;
const ERN_RC_LOCAL_FILE_PATH = `${process.cwd()}/.ernrc`;

class ErnConfig {
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

export default new ErnConfig();
