import { errorMessage } from "./contracts.js";
import type { Translate, SessionDetail, SessionSummary } from "./contracts.js";
type HealthResult = Partial<ReturnType<typeof import("./archive-discovery.js").repairResultSchema.parse>> & { repairable: boolean };
interface HealthProps {
 items: SessionDetail[]; sessions: (SessionSummary & { displayTitle?: string })[]; t?: Translate; isArchived?: boolean;
 diagnoseSession?: (input: {sessionId: string}) => Promise<HealthResult>;
 repairSession?: (input: {sessionId: string; token?: string}) => Promise<HealthResult>;
 retry(): void; pending: boolean;
}
import { healthZh, healthEn } from "./session-health-locales.js";
export { healthZh, healthEn };
const defaultT: Translate = (key, args = {}) => Object.entries(args).reduce((text, [name, value]) => text.replaceAll("{" + name + "}", String(value)), (healthZh as Record<string, string>)[key] ?? key);

import { classifySessionError } from "./archive-discovery.js";

/** 使用宿主主题和图标，诊断样式与组件一起挂载，避免依赖外部样式字符串替换。 */
export const sessionHealthCss = `
.dsham_health{margin:0 0 16px;font-size:13px;line-height:1.6;color:var(--dsw-alias-label-primary);--health-accent:var(--dsw-alias-state-business-primary,#507fe5);--health-warning:var(--dsw-alias-state-warn-label)}
.dsham_health p{margin:0}.dsham_healthPanel{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.dsham_healthSummary{display:flex;align-items:center;gap:10px;min-height:52px;padding:12px 16px;list-style:none;cursor:pointer;box-sizing:border-box}
.dsham_health summary::-webkit-details-marker{display:none}.dsham_health summary::marker{content:''}
.dsham_healthSummary:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsham_healthIcon{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:8px;background:color-mix(in srgb,var(--health-warning) 12%,transparent);color:var(--health-warning)}
.dsham_healthSummaryText{flex:1;min-width:0;font-weight:600}.dsham_healthCount{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;margin-left:8px;padding:0 6px;box-sizing:border-box;border-radius:6px;background:var(--dsw-alias-bg-layer-3);font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsham_healthSummaryHint{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400}.dsham_healthChevron{display:flex;transition:transform .15s ease}.dsham_healthPanel[open]>.dsham_healthSummary .dsham_healthChevron{transform:rotate(180deg)}
.dsham_healthBody{border-top:1px solid var(--dsw-alias-border-l2);padding:14px;display:grid;gap:10px}.dsham_healthIntro{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 2px 4px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsham_healthItem{padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-3)}
.dsham_healthRow{display:flex;align-items:center;justify-content:space-between;gap:16px}.dsham_healthCopy{flex:1;min-width:0}.dsham_healthTitle{display:block;font-size:13px;font-weight:600;overflow-wrap:anywhere}.dsham_healthState{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsham_healthState[data-state=ready]{color:var(--dsw-alias-label-primary)}.dsham_healthState[data-state=ready]>span{color:var(--health-accent)}.dsham_healthState[data-state=success]{color:var(--dsw-alias-state-success-primary,#60b58a)}
.dsham_healthButton{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:none;min-height:32px;padding:5px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s}
.dsham_healthButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-label-secondary)}.dsham_healthButton[data-primary=true]{background:var(--dsw-alias-button-primary-fill,#3169c6);border-color:transparent;color:var(--dsw-alias-label-primary-foreground,#fff)}.dsham_healthButton[data-primary=true]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill,#3169c6));border-color:transparent}.dsham_healthButton:disabled{opacity:.5;cursor:wait}.dsham_healthButton[data-subtle=true]{border-color:transparent;padding:3px 6px;min-height:28px;color:var(--dsw-alias-label-secondary)}
.dsham_healthAdvice{margin-top:10px!important;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:12px;overflow-wrap:anywhere}.dsham_healthTech{margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary)}.dsham_healthTech>summary{display:inline-flex;gap:4px;align-items:center;min-height:24px;cursor:pointer}.dsham_healthTech[open]>summary .dsham_healthChevron{transform:rotate(180deg)}.dsham_healthLog{margin-top:8px;padding:10px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);overflow-wrap:anywhere;font:11px/1.7 ui-monospace,monospace}.dsham_healthLog p+p{margin-top:6px}
.dsham_healthNotice{display:flex;align-items:center;gap:8px;padding:10px 12px;margin-bottom:10px!important;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;color:var(--dsw-alias-label-primary)}
.dsham_health button:focus-visible,.dsham_health summary:focus-visible{outline:2px solid var(--health-accent);outline-offset:3px}.dsham_health svg{flex:none}
@media(max-width:520px){.dsham_healthSummary{padding:12px}.dsham_healthSummaryHint{display:none}.dsham_healthBody{padding:10px}.dsham_healthItem{padding:12px}.dsham_healthRow{align-items:flex-start;flex-wrap:wrap;gap:12px}.dsham_healthCopy{flex-basis:65%}.dsham_healthButton{min-height:36px}.dsham_healthIntro{align-items:flex-start}.dsham_healthIntro>span{flex:1}}
@media(prefers-reduced-motion:reduce){.dsham_health *{transition:none!important}}
`;

/** 异常默认折叠；只在服务端完成诊断后提供确认修复。 */
export function createSessionHealthPanel(React: typeof import("react"), icons: Record<string, import("react").ComponentType<{ size?: number; className?: string; width?: number; height?: number }>> = {}) {
  const h = React.createElement;
  const icon = (name: string, className?: string) => icons[name] ? h('span', { className, 'aria-hidden': true }, h(icons[name], { width: 16, height: 16 })) : null;
  return function SessionHealthPanel({ items, sessions, t = defaultT, isArchived = true, diagnoseSession, repairSession, retry, pending }: HealthProps) {
    const [results, setResults] = React.useState<Record<string, HealthResult>>({});
    const [busyId, setBusyId] = React.useState('');
    const [notice, setNotice] = React.useState<string | boolean>("");
    const errors = items.filter(row => row.error);
    const run = async (row: SessionDetail, repair: boolean) => {
      if (busyId) return;
      setBusyId(row.sessionId); setNotice('');
      try {
        const result = await (repair && repairSession ? repairSession({ sessionId: row.sessionId, token: results[row.sessionId].token }) : diagnoseSession!({ sessionId: row.sessionId }));
        setResults(previous => ({ ...previous, [row.sessionId]: result }));
        if (result.repaired) { setNotice(true); retry(); }
      } catch (error) {
        setResults(previous => ({ ...previous, [row.sessionId]: { repairable: false, code: 'failed', reason: '', advice: errorMessage(error).slice(0,1000) } }));
      } finally { setBusyId(''); }
    };
    return h('div', { className: 'dsham_health' }, h('style', null, sessionHealthCss),
      notice && h('p', { role: 'status', className: 'dsham_healthNotice' }, icon('check'), t('health.notice')),
      errors.length > 0 && h('details', { className: 'dsham_healthPanel' },
        h('summary', { className: 'dsham_healthSummary' }, icon('warning', 'dsham_healthIcon'),
          h('span', { className: 'dsham_healthSummaryText' }, t(isArchived ? 'health.archived' : 'health.unarchived'), h('span', { className: 'dsham_healthCount' }, errors.length)),
          h('span', { className: 'dsham_healthSummaryHint' }, t('health.heading')), icon('chevron', 'dsham_healthChevron')),
        h('div', { className: 'dsham_healthBody' },
          h('div', { className: 'dsham_healthIntro' }, h('span', null, t(isArchived ? 'health.scopeArchived' : 'health.scopeUnarchived')),
            h('button', { type: 'button', className: 'dsham_healthButton', 'data-subtle': true, disabled: pending || Boolean(busyId), onClick: retry }, icon('refresh'), t('health.retry'))),
          errors.map(row => {
            const diagnostic = classifySessionError(row.error);
            const result = results[row.sessionId];
            const code = result ? (Object.hasOwn(healthZh, 'health.' + result.code + '.reason') ? result.code : result.repaired ? 'repaired' : result.repairable ? 'ready' : 'blocked') : diagnostic.code;
            const title = sessions.find(session => session.id === row.sessionId);
            const repairing = result?.repairable && repairSession;
            return h('section', { key: row.sessionId, className: 'dsham_healthItem', 'aria-busy': busyId === row.sessionId },
              h('div', { className: 'dsham_healthRow' },
                h('div', { className: 'dsham_healthCopy' }, h('strong', { className: 'dsham_healthTitle' }, title?.displayTitle || title?.title || row.sessionId),
                  h('div', { className: 'dsham_healthState', 'data-state': result?.repaired ? 'success' : repairing ? 'ready' : 'pending', role: result ? 'status' : undefined },
                    icon(result?.repaired ? 'check' : 'info'), t('health.' + code + '.reason', { n: result?.count ?? 0 }))),
                diagnoseSession && h('button', { type: 'button', className: 'dsham_healthButton', 'data-primary': Boolean(repairing), disabled: Boolean(busyId), onClick: () => run(row, Boolean(repairing)) },
                  icon(busyId === row.sessionId ? 'refresh' : repairing ? 'check' : 'search'), t(busyId === row.sessionId ? 'health.busy' : repairing ? 'health.confirm' : 'health.diagnose'))),
              result && h('p', { className: 'dsham_healthAdvice' }, t('health.' + code + '.advice')),
              !result && diagnostic.code !== 'legacy-source' && h('p', { className: 'dsham_healthAdvice' }, t('health.' + code + '.advice')),
              h('details', { className: 'dsham_healthTech' }, h('summary', null, icon('chevron', 'dsham_healthChevron'), t('health.technical')),
                h('div', { className: 'dsham_healthLog' }, h('p', null, row.sessionId), h('p', null, row.error), result?.reason && h('p', null, result.reason), result?.advice && h('p', null, result.advice))));
          }))));
  };
}
