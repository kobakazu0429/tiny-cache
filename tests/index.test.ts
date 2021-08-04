import path from "path";
import { Cache } from "./../src/index";

const HASH = "this_is_hash";
const CACHE_FILE_NAME = `tiny-cache-${HASH}`;

describe("Cache", () => {
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

  describe("Cache.isCacheValid", () => {
    test("not cached", () => {
      const cache = new Cache(HASH);
      expect(cache.isCacheValid()).toBeFalsy();
    });

    test("infinite cache", () => {
      const cache = new Cache(HASH);
      Object.defineProperty(cache, "cacheInMemory", { value: "this_is_cache" });
      Object.defineProperty(cache, "createdAt", { value: 1 });
      expect(cache.isCacheValid(-1)).toBeTruthy();
    });

    test("not expire", () => {
      Date.now = jest.fn(() => 1628043400);
      const aliveTime = 50;
      const elapsedTime = 20;
      const createdAt = Date.now() / 1000 - elapsedTime;
      const cache = new Cache(HASH);
      Object.defineProperty(cache, "cacheInMemory", { value: "this_is_cache" });
      expect(cache.isCacheValid(aliveTime, createdAt)).toBeTruthy();
    });

    test("expire", () => {
      Date.now = jest.fn(() => 1628043400);
      const aliveTime = 50;
      const elapsedTime = 100;
      const createdAt = Date.now() / 1000 - elapsedTime;
      const cache = new Cache(HASH);
      Object.defineProperty(cache, "cacheInMemory", { value: "this_is_cache" });
      expect(cache.isCacheValid(aliveTime, createdAt)).toBeFalsy();
    });
  });
});
