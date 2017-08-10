import fs from "fs";
import path from "path";
import {sync as mkdirsSync} from "mkdirp";
function canAccess(file) {
    try {
        fs.accessSync(file);
        return true;
    } catch (e) {
    }
    return false;
}
const toString = String.valueOf();

export default class File {
    static separator = path.sep;
    static separatorChar = path.sep;

    constructor(file, ...args) {
        if (!file) {
            throw new Error(`File needs an argument`);
        }
        if (file instanceof File && args.length === 0) {
            return file;
        }
        this._filename = args.length ? path.join(toString(file), ...args.map(toString)) : toString(file);
    }

    relativeTo(file) {

        if (file instanceof File) {
            file = file._filename;
        }
        const relPath = path.relative(file, this._filename);
        return new File(relPath);
    }

    toAbsolutePath() {
        return this.getAbsoluteFile().getPath();
    }

    getAbsolutePath() {
        return this.toAbsolutePath();
    }

    isAbsolute() {
        return this._filename.startsWith("/");
    }

    toAbsolute() {
        return this.getAbsoluteFile();
    }

    getAbsoluteFile() {
        if (this.isAbsolute()) {
            return this;
        }
        return new File(path.join(process.cwd(), this._filename));
    }

    canRead() {
        return this.exists() && canAccess(this._filename);
    }

    exists() {
        return fs.existsSync(this._filename);
    }

    getName() {
        return this._filename;
    }

    getParentFile() {
        if (this._parent) {
            return this._parent;
        }
        this._parent = new File(path.resolve(this._filename, '..'));
        return this._parent;
    }

    getPath() {
        return this._filename;
    }

    _() {
        if (!this._stat) {
            if (!this.exists()) return false;
            this._stat = fs.statSync(this._filename);
        }
        return this._stat;
    }

    isDirectory() {
        const s = this._();
        return s && s.isDirectory();
    }

    isFile() {
        const s = this._();
        return s && s.isFile();
    }

    mkdirs() {
        return mkdirsSync(this._filename);
    }

    toString() {
        return this._filename
    }
}
