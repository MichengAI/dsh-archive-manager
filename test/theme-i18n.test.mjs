import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryZh, discoveryEn, discoveryJa, discoveryEs, discoveryFr, discoveryDe, discoveryRu, discoveryPt } from '../src/archive-discovery-ui.ts';
import { organizerZh, organizerEn, organizerJa, organizerEs, organizerFr, organizerDe, organizerRu, organizerPt } from '../src/archive-organizer-ui.ts';
import { ZH, EN } from '../src/plugin-update-model.ts';

test('8门语言词条及动态占位符严格一致', () => {
  const discoveryLangs = [discoveryZh, discoveryEn, discoveryJa, discoveryEs, discoveryFr, discoveryDe, discoveryRu, discoveryPt];
  const organizerLangs = [organizerZh, organizerEn, organizerJa, organizerEs, organizerFr, organizerDe, organizerRu, organizerPt];

  for (const group of [discoveryLangs, organizerLangs]) {
    const base = group[0];
    const baseKeys = Object.keys(base).sort();
    for (const dict of group) {
      assert.deepEqual(Object.keys(dict).sort(), baseKeys);
      for (const key of baseKeys) {
        assert.ok(typeof dict[key] === 'string' && dict[key].length > 0, `空值检查: ${key}`);
        assert.deepEqual((base[key].match(/\{\w+\}/g) ?? []).sort(), (dict[key].match(/\{\w+\}/g) ?? []).sort(), key);
      }
    }
  }

  assert.deepEqual(Object.keys(ZH).sort(), Object.keys(EN).sort());
  for (const key of Object.keys(ZH)) {
    assert.deepEqual((ZH[key].match(/\{\w+\}/g) ?? []).sort(), (EN[key].match(/\{\w+\}/g) ?? []).sort(), key);
  }
});
