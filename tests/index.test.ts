import path from "path";
import { vol } from "memfs";
import { Cache } from "./../src/index";

const HASH = "this_is_hash";
const CACHE_FILE_NAME = `tiny-cache-${HASH}`;

jest.mock("fs/promises");

describe("Cache", () => {
  beforeEach(() => {
    vol.reset();
  });

  test("Cache.cacheFilename", () => {
    const cache = new Cache(HASH);
    expect(cache.cacheFilename).toBe(CACHE_FILE_NAME);
  });

  describe("Cache.rootDir", () => {
    test("default", () => {
      const DEFAULT_CACHE_DIRECTORY = ".cache";
      const cacheRootDir = path.resolve(
        path.join(".", DEFAULT_CACHE_DIRECTORY)
      );

      const cache = new Cache(HASH);
      expect(cache.rootDir).toBe(cacheRootDir);
    });

    test("absolute path", () => {
      const cacheDirectory = "/tmp/.cache";
      const cache = new Cache(HASH, { cacheDirectory });
      expect(cache.rootDir).toBe(cacheDirectory);
    });
  });

  describe("Cache.cachePath", () => {
    test("default", () => {
      const DEFAULT_CACHE_DIRECTORY = ".cache";
      const cachePath = path.resolve(
        path.join(".", DEFAULT_CACHE_DIRECTORY, CACHE_FILE_NAME)
      );

      const cache = new Cache(HASH);
      expect(cache.cachePath).toBe(cachePath);
    });

    test("absolute path", () => {
      const cacheDirectory = "/tmp/.cache";
      const cachePath = path.resolve(
        path.join(cacheDirectory, CACHE_FILE_NAME)
      );
      const cache = new Cache(HASH, { cacheDirectory });
      expect(cache.cachePath).toBe(cachePath);
    });
  });

  describe("Cache.save and Cache.read", () => {
    test("save string", async () => {
      const now = 1628043400;
      Date.now = jest.fn(() => now);

      const cacheDirectory = "/";
      const cache = new Cache(HASH, { cacheDirectory });
      const contents = "this_is_string";
      await cache.save(contents);

      const file = vol.toJSON()[cache.cachePath] as string;
      expect(JSON.parse(file)).toStrictEqual({
        createdAt: now,
        contents,
      });

      const savedCache = await cache.read();
      expect(savedCache).toEqual(contents);
    });

    test("save JSON", async () => {
      const now = 1628043400;
      Date.now = jest.fn(() => now);

      const cacheDirectory = "/";
      const cache = new Cache(HASH, { cacheDirectory });
      const contents = [{ key1: "value1" }, { key2: "value2" }];
      await cache.save(JSON.stringify(contents));

      const file = vol.toJSON()[cache.cachePath] as string;
      expect(JSON.parse(file)).toStrictEqual({
        createdAt: now,
        contents: JSON.stringify(contents),
      });

      const savedCache = await cache.read();
      expect(savedCache).toEqual(JSON.stringify(contents));
    });
  });

  describe("Cache.isCacheValid", () => {
    test("not cached", async () => {
      const cache = new Cache(HASH);
      expect(await cache.isCacheValid()).toBeFalsy();
    });

    test("infinite cache", async () => {
      const cache = new Cache(HASH);
      Object.defineProperty(cache, "cacheInMemory", { value: "this_is_cache" });
      Object.defineProperty(cache, "createdAt", { value: 1 });
      expect(await cache.isCacheValid(-1)).toBeTruthy();
    });

    test("not expire", async () => {
      Date.now = jest.fn(() => 1628043400);
      const aliveTime = 50;
      const elapsedTime = 20;
      const createdAt = Date.now() - elapsedTime * 1000;
      const cache = new Cache(HASH);
      Object.defineProperty(cache, "cacheInMemory", { value: "this_is_cache" });
      expect(await cache.isCacheValid(aliveTime, createdAt)).toBeTruthy();
    });

    test("expire", async () => {
      Date.now = jest.fn(() => 1628043400);
      const aliveTime = 50;
      const elapsedTime = 100;
      const createdAt = Date.now() - elapsedTime * 1000;
      const cache = new Cache(HASH);
      Object.defineProperty(cache, "cacheInMemory", { value: "this_is_cache" });
      expect(await cache.isCacheValid(aliveTime, createdAt)).toBeFalsy();
    });
  });

  describe("Cache.isCached", () => {
    test("not cached", async () => {
      const cache = new Cache(HASH);
      const isCached = await cache.isCached();
      expect(isCached).toBeFalsy();
    });

    test("cached", async () => {
      const cache = new Cache(HASH);
      const contents = "this_is_string";
      await cache.save(contents);

      const isCached = await cache.isCached();
      expect(isCached).toBeTruthy();
    });
  });
});
