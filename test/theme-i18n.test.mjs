import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryZh, discoveryEn } from '../src/archive-discovery-ui.ts';
import { organizerZh, organizerEn } from '../src/archive-organizer-ui.ts';
import { ZH, EN } from '../src/plugin-update-model.ts';

test('中英文词条及动态占位符一致', () => {
  for (const [zh, en] of [[discoveryZh, discoveryEn], [organizerZh, organizerEn], [ZH, EN]]) {
    assert.ok(zh && en);
    assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
    for (const key of Object.keys(zh)) {
      assert.deepEqual((zh[key].match(/\{\w+\}/g) ?? []).sort(), (en[key].match(/\{\w+\}/g) ?? []).sort(), key);
    }
  }
});
