import path from 'path';
const cwd = path.join.bind(path, process.cwd());
export default cwd;
