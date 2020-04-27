import fs from 'fs-extra';
import path from 'path';
import shell from './shell';
import uuidv4 from 'uuid/v4';
import getSize from 'get-folder-size';

/**
 * Gets the total size (in bytes) of a given directory
 * @param dirPath path to the directory for which to compute size
 */
const getSizeAsync: (dirPath: string) => Promise<number> = dirPath =>
  new Promise((resolve, reject) => {
    getSize(dirPath, (err, size) => {
      err ? reject(err) : resolve(size);
    });
  });

export interface CacheManifest {
  /**
   * Entries stored in the cache
   */
  entries: CacheManifestEntry[];
  /**
   * Total size of the cache
   */
  size: number;
}

export interface CacheManifestEntry {
  /**
   * Id of the entry
   * ex: my-miniapp@1.0.0
   */
  id: string;
  /**
   * Absolute path to the entry
   * ex : /Users/blemair/.ern/cache/78c40fda-d5bb-4681-9bd2-a5fba9df1f70
   */
  path: string;
  /**
   * Size in bytes of the entry
   */
  size: number;
  /**
   * Time (epoc) when the entry was last accessed
   */
  lastAccessed: number;
}

const cacheManifestFileName = 'cache-manifest.json';
export const maxDefaultCacheSize = 2 * 1024 * 1024 * 1024; /* 2GB */

type AddObjectToCacheDirectory<T> = (obj: T, dirPath: string) => Promise<void>;
type ObjectToId<T> = (obj: T) => string;

/**
 * Simple generic file system based LRU cache.
 * This cache stores arbirtrary objects in unique directories.
 * The root directory for the cache can be configured, as well as
 * the maximum size allowed for the cache.
 * Once cache reaches max size, the least recenctly accessed
 * objects will be removed from the cache, until size of the cache
 * falls below maximum size.
 */
export class FsCache<T> {
  /**
   * Root path to the directory holding the cache
   */
  public readonly rootCachePath: string;
  /**
   * Maximum cache size (in bytes)
   */
  public readonly maxCacheSize: number;
  /**
   * Custom function invoked to add an object entry to the cache
   */
  private readonly addObjectToCacheDirectory: AddObjectToCacheDirectory<T>;
  /**
   * Custom function invoked to convert an object entry to a unique id
   */
  private readonly objectToId: ObjectToId<T>;

  constructor({
    /**
     * Custom function invoked to add an object entry to the cache
     */
    addObjectToCacheDirectory,
    /**
     * Custom function invoked to convert an object entry to a unique id
     */
    objectToId,
    /**
     * Maximum cache size (in bytes)
     */
    maxCacheSize = maxDefaultCacheSize,
    /**
     * Root path to the directory holding the cache
     */
    rootCachePath,
  }: {
    addObjectToCacheDirectory: AddObjectToCacheDirectory<T>;
    objectToId: ObjectToId<T>;
    maxCacheSize?: number;
    rootCachePath: string;
  }) {
    this.rootCachePath = rootCachePath;
    this.maxCacheSize = maxCacheSize;
    this.addObjectToCacheDirectory = addObjectToCacheDirectory;
    this.objectToId = objectToId;
    fs.ensureDirSync(rootCachePath);
    if (!fs.existsSync(this.cacheManifestPath)) {
      fs.writeJsonSync(
        this.cacheManifestPath,
        { entries: [], size: 0 },
        { spaces: 2 },
      );
    }
  }

  /**
   * Indicates whether a given object is currently stored in the cache
   * @param obj The object to check for presence in the cache
   */
  public async isInCache(obj: T): Promise<boolean> {
    const manifestObj = await this.getManifestObj();
    return !!manifestObj.entries.find(e => e.id === this.objectToId(obj));
  }

  /**
   * Adds an object entry to the cache
   * @param obj The object to add to the cache
   */
  public async addToCache(obj: T): Promise<string> {
    if (await this.isInCache(obj)) {
      throw new Error(
        `Object with id ${this.objectToId(obj)} is already in the cache`,
      );
    }
    // Create unique directory to store the object
    const pathToObjectCacheDir = this.createUniqueCacheDirectory();
    // Invoke client provided function to write object in cache directory
    await this.addObjectToCacheDirectory(obj, pathToObjectCacheDir);
    // Compute cached object directory size
    const cachedObjectDirSize = await getSizeAsync(pathToObjectCacheDir);
    // Create manifest entry for new cached object
    const entry: CacheManifestEntry = {
      id: this.objectToId(obj),
      lastAccessed: Date.now(),
      path: pathToObjectCacheDir,
      size: cachedObjectDirSize,
    };
    // Update manifest total cache size
    const manifestObj = await this.getManifestObj();
    manifestObj.size += cachedObjectDirSize;
    manifestObj.entries.push(entry);
    // Clean cache if newly added object caused total cache
    // size to exceed the defined max cache size
    // Remove all entries that were least recently accessed
    // until the total cache size falls below the max cache size
    const entriesSortedByLat = manifestObj.entries.sort(
      (a, b) => b.lastAccessed - a.lastAccessed,
    );
    while (manifestObj.size >= this.maxCacheSize) {
      const entryToRemove = entriesSortedByLat.pop();
      manifestObj.size -= entryToRemove!.size;
      shell.rm('-rf', entryToRemove!.id);
    }
    manifestObj.entries = entriesSortedByLat;
    // Save updated manifest
    await fs.writeJson(this.cacheManifestPath, manifestObj, { spaces: 2 });
    return pathToObjectCacheDir;
  }

  /**
   * Gets path to the directory containing a cached object
   * @param obj The object for which to retrieve cached directory path
   */
  public async getObjectCachePath(obj: T): Promise<string | void> {
    const manifestObj = await this.getManifestObj();
    const cacheEntry = manifestObj.entries.find(
      e => e.id === this.objectToId(obj),
    );
    if (cacheEntry) {
      cacheEntry.lastAccessed = Date.now();
      await fs.writeJson(this.cacheManifestPath, manifestObj, { spaces: 2 });
      return cacheEntry.path;
    }
  }

  /**
   * Gets the cache manifest object
   */
  private async getManifestObj(): Promise<CacheManifest> {
    return fs.readJson(this.cacheManifestPath);
  }

  /**
   * Creates a uniquely named cache directory
   */
  private createUniqueCacheDirectory(): string {
    const pathToCacheDirectory = path.join(this.rootCachePath, uuidv4());
    shell.mkdir(pathToCacheDirectory);
    return pathToCacheDirectory;
  }

  /**
   * Gets the path to the cache manifest file
   */
  private get cacheManifestPath() {
    return path.join(this.rootCachePath, cacheManifestFileName);
  }
}
