import fs from "fs/promises";
import path from "path";

/**
 * cache valid duration time as seccond
 * 0~ or -1 as infinite validated
 */
type Duration = number;
type CreatedAt = number;

export interface Options {
  cacheDirectory: string;
  duration: Duration;
}

export interface CacheFile {
  createdAt: CreatedAt;
  contents: string;
}

const defaultOptions: Options = {
  cacheDirectory: ".cache",
  duration: 60 * 60 * 24,
};

export class Cache {
  private hash: string;
  private options: Options;
  private createdAt: CreatedAt;
  private cacheInMemory?: string;

  constructor(uniqueKey: string, options: Partial<Options> = {}) {
    this.hash = uniqueKey;
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.createdAt = new Date(0).getTime();
  }

  get cacheFilename(): string {
    return `tiny-cache-${this.hash}`;
  }

  get rootDir(): string {
    // if (!this.options.cacheDirectory.startsWith("/")) {
    //   return path.resolve(process.env.ELEVENTY_ROOT, this.cacheDirectory);
    // }

    return path.resolve(this.options.cacheDirectory);
  }

  get cachePath(): string {
    return path.join(this.rootDir, this.cacheFilename);
  }

  async ensureDir() {
    // make cacheDirectory if it does not exist.
    await fs.mkdir(this.options.cacheDirectory, {
      recursive: true,
    });
  }

  async save(contents: string): Promise<void> {
    this.createdAt = Date.now();
    this.cacheInMemory = contents;
    const data: CacheFile = {
      createdAt: this.createdAt,
      contents,
    };
    await this.ensureDir();
    await fs.writeFile(this.cachePath, JSON.stringify(data), "utf-8");
  }

  public async read(): Promise<string> {
    if (this.cacheInMemory) return this.cacheInMemory;
    const cacheFileRaw = await fs.readFile(this.cachePath, "utf-8");
    const cacheFile: CacheFile = JSON.parse(cacheFileRaw);
    return cacheFile.contents;
  }

  public async isCacheValid(
    duration: Duration = this.options.duration,
    createdAt: CreatedAt = this.createdAt
  ): Promise<boolean> {
    if (await this.isCached()) {
      return true;
    }

    // not cached
    if (
      this.cacheInMemory === undefined ||
      createdAt === new Date(0).getTime()
    ) {
      return false;
    }

    // "-1" is infinite duration
    if (duration === -1) return true;

    // multiple by 1000 is second to millisecond
    const expiration = createdAt + duration * 1000;
    if (expiration > Date.now()) return true;

    return false;
  }

  public async isCached(): Promise<boolean> {
    try {
      return (await fs.lstat(this.cachePath)).isFile();
    } catch (_e) {
      return false;
    }
  }
}
