import { isDeepStrictEqual } from "node:util";
async function confirmColdCacheWrite(cache, source, { attempts = 100, wait = () => new Promise((resolve) => setTimeout(resolve, 20)) } = {}) {
  const expected = cache.coldSnapshot(source.meta, source.inheritedEventCount, source.events);
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (isDeepStrictEqual(cache.cachedSnapshot(source.meta), expected)) return expected;
    await wait();
  }
  throw new Error("Official cache persistence could not be confirmed; retry is safe only after lifecycle revalidation.");
}
export {
  confirmColdCacheWrite
};
