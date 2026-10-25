import { isDeepStrictEqual } from "node:util";

type CacheSnapshot = { asOfSeq: number; values: object };
interface ColdCache<Meta, Events> {
  coldSnapshot(meta: Meta, inheritedEventCount: number, events: Events): CacheSnapshot;
  cachedSnapshot(meta: Meta): CacheSnapshot | undefined;
}

/**
 * coldSnapshot 仅安排容错写入；官方 cachedSnapshot 读取持久化成功后的域状态，
 * 因此只有匹配的回读才能确认保存。超时表示未确认，既不是成功也不是取消。
 * 调用方还须单独串行化生命周期变更，尤其是删除操作。
 */
export async function confirmColdCacheWrite<Meta, Events>(
  cache: ColdCache<Meta, Events>,
  source: { meta: Meta; inheritedEventCount: number; events: Events },
  { attempts = 100, wait = () => new Promise<void>(resolve => setTimeout(resolve, 20)) }: {
    attempts?: number; wait?: () => Promise<void>;
  } = {},
): Promise<CacheSnapshot> {
  const expected = cache.coldSnapshot(source.meta, source.inheritedEventCount, source.events);
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (isDeepStrictEqual(cache.cachedSnapshot(source.meta), expected)) return expected;
    await wait();
  }
  throw new Error("Official cache persistence could not be confirmed; retry is safe only after lifecycle revalidation.");
}
