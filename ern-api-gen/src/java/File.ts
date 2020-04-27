/* tslint:disable:variable-name */
import fs from 'fs';
import path from 'path';
import { sync as mkdirsSync } from 'mkdirp';

function canAccess(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch (e) {
    // Swallow
  }
  return false;
}
const toString: (s) => string = String.valueOf() as (s) => string;

export default class File {
  public static separator = path.sep;
  public static separatorChar = path.sep;
  private _filename;
  private _parent;
  private _stat;

  constructor(file, ...args) {
    if (!file) {
      throw new Error(`File needs an argument`);
    }
    if (file instanceof File && args.length === 0) {
      return file;
    }
    this._filename = args.length
      ? path.join(toString(file), ...args.map(toString))
      : toString(file);
  }

  public relativeTo(file) {
    if (file instanceof File) {
      file = file._filename;
    }
    const relPath = path.relative(file, this._filename);
    return new File(relPath);
  }

  public toAbsolutePath() {
    return this.getAbsoluteFile().getPath();
  }

  public getAbsolutePath() {
    return this.toAbsolutePath();
  }

  public isAbsolute() {
    return path.isAbsolute(this._filename);
  }

  public toAbsolute() {
    return this.getAbsoluteFile();
  }

  public getAbsoluteFile() {
    if (this.isAbsolute()) {
      return this;
    }
    return new File(path.join(process.cwd(), this._filename));
  }

  public canRead() {
    return this.exists() && canAccess(this._filename);
  }

  public exists() {
    return fs.existsSync(this._filename);
  }

  public getName() {
    return this._filename;
  }

  public getParentFile() {
    if (this._parent) {
      return this._parent;
    }
    this._parent = new File(path.resolve(this._filename, '..'));
    return this._parent;
  }

  public getPath() {
    return this._filename;
  }

  public _() {
    if (!this._stat) {
      if (!this.exists()) {
        return false;
      }
      this._stat = fs.statSync(this._filename);
    }
    return this._stat;
  }

  public isDirectory() {
    const s = this._();
    return s && s.isDirectory();
  }

  public isFile() {
    const s = this._();
    return s && s.isFile();
  }

  public mkdirs() {
    return mkdirsSync(this._filename);
  }

  public toString() {
    return this._filename;
  }
}
