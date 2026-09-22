import test from 'node:test';
import assert from 'node:assert/strict';
import * as health from '../src/session-health-ui.ts';
import { repairResultSchema, classifySessionError } from '../src/archive-discovery.ts';
import { discoveryZh, discoveryEn } from '../src/archive-discovery-ui.ts';
import { organizerZh, organizerEn } from '../src/archive-organizer-ui.ts';
import { ZH, EN } from '../src/plugin-update-model.ts';

test('错误分类优先稳定代码，未知宿主代码才回退文案', () => {
  assert.equal(classifySessionError({ code: 'EACCES', message: 'not found' }).code, 'permission');
  assert.equal(classifySessionError({ code: 'legacy-source', message: '完全不同的说明' }).code, 'legacy-source');
  assert.equal(classifySessionError({ code: 'NEW_HOST_CODE', message: 'unclassified message source' }).code, 'legacy-source');
});

test('中英文词条及动态占位符一致', () => {
  for (const [zh, en] of [[health.healthZh, health.healthEn], [discoveryZh, discoveryEn], [organizerZh, organizerEn], [ZH, EN]]) {
    assert.ok(zh && en);
    assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
    for (const key of Object.keys(zh)) {
      assert.deepEqual((zh[key].match(/\{\w+\}/g) ?? []).sort(), (en[key].match(/\{\w+\}/g) ?? []).sort(), key);
    }
  }
});

test('修复结果保留稳定状态码并兼容旧宿主', () => {
  const value = {sessionId:'a',repairable:true,repaired:false,reason:'技术原文',advice:'原始说明',code:'ready',count:2};
  assert.equal(repairResultSchema.parse(value).code, 'ready');
  delete value.code;
  assert.doesNotThrow(() => repairResultSchema.parse(value));
});

test('英文诊断、修复及失败状态不泄露中文到主说明', async () => {
  const slots=[];let cursor=0;
  const React={useState(value){const i=cursor++;slots[i]??=value;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];},createElement:(type,props,...children)=>({type,props:props??{},children})};
  const t=(key,args={})=>Object.entries(args).reduce((text,[name,value])=>text.replaceAll('{'+name+'}',String(value)),health.healthEn?.[key]??key);
  const Panel=health.createSessionHealthPanel(React);
  const props={t,items:[{sessionId:'a',error:'unclassified message source'}],sessions:[],retry(){},diagnoseSession:async()=>({code:'ready',count:2,repairable:true,token:'a'.repeat(64),reason:'中文技术原因',advice:'中文技术说明'}),repairSession:async()=>{throw new Error('中文宿主错误');}};
  const render=()=>{cursor=0;return Panel(props);};
  const flat=n=>!n||typeof n!=='object'?[]:[n,...(n.children??[]).flat(Infinity).flatMap(flat)];
  const text=n=>typeof n==='string'?n:(n?.children??[]).flat(Infinity).map(text).join(' ');
  const button=(tree,label)=>flat(tree).find(n=>(n.children??[]).flat(Infinity).includes(label));
  let tree=render();assert.ok(button(tree,'Diagnose session'));
  await button(tree,'Diagnose session').props.onClick();tree=render();
  assert.match(text(flat(tree).find(n=>n.props.className==='dsham_healthState')), /2/);
  await button(tree,'Confirm repair').props.onClick();tree=render();
  assert.doesNotMatch(text(flat(tree).find(n=>n.props.className==='dsham_healthAdvice')), /[\u4e00-\u9fff]/);
  assert.match(text(flat(tree).find(n=>n.props.className==='dsham_healthLog')), /中文宿主错误/);
});
