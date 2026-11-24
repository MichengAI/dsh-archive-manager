import { AsyncLocalStorage } from "node:async_hooks";
import { symbols } from "@deepseek-ai/cordis";
const runtimes = /* @__PURE__ */ new WeakMap();
const migrationContext = new AsyncLocalStorage();
function getRaw(value) {
  if (value && typeof value === "object") {
    const original = Reflect.get(value, symbols.original);
    if (original !== null && typeof original === "object") return original;
  }
  return value;
}
function migrationInProgressError() {
  const err = new Error("\u8BE5\u4F1A\u8BDD\u6B63\u5728\u8DE8\u5DE5\u4F5C\u533A\u79FB\u52A8\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
  err.code = "migration-in-progress";
  return err;
}
function installSessionLifecycle(owner) {
  const agentsObj = typeof owner.get === "function" ? owner.get("agents") : owner.agents;
  const rawAgents = getRaw(agentsObj);
  if (!rawAgents || typeof rawAgents !== "object") return () => {
  };
  if (runtimes.has(rawAgents)) return () => {
  };
  const runtime = { handles: /* @__PURE__ */ new Map(), moving: /* @__PURE__ */ new Set() };
  runtimes.set(rawAgents, runtime);
  const restore = [];
  for (const method of ["create", "resume"]) {
    const originalMethod = rawAgents[method];
    if (typeof originalMethod !== "function") continue;
    const wrapped = async function(options, ...args) {
      const id = options?.sessionId ?? options?.resumeSessionId;
      if (id && runtime.moving.has(id) && migrationContext.getStore() !== runtime) {
        throw migrationInProgressError();
      }
      const handle = await Reflect.apply(originalMethod, this, [options, ...args]);
      const agent = getRaw(handle?.agent);
      if (agent?.id && typeof handle?.dispose === "function") {
        const guards = [];
        runtime.handles.set(agent.id, { handle, agent, guards });
        for (const actionName of ["send", "followup", "runMaintenance"]) {
          const action = agent[actionName];
          if (typeof action !== "function") continue;
          const guarded = function(...params) {
            if (runtime.moving.has(agent.id) || getRaw(rawAgents.get?.(agent.id)) !== agent) {
              throw migrationInProgressError();
            }
            return Reflect.apply(action, this, params);
          };
          agent[actionName] = guarded;
          guards.push(() => {
            if (agent[actionName] === guarded) agent[actionName] = action;
          });
        }
      }
      return handle;
    };
    rawAgents[method] = wrapped;
    restore.push(() => {
      if (rawAgents[method] === wrapped) rawAgents[method] = originalMethod;
    });
  }
  owner.on?.("agent/disposed", (payload) => {
    const agent = getRaw(payload?.agent);
    if (agent?.id) {
      const entry = runtime.handles.get(agent.id);
      if (entry && getRaw(entry.agent) === agent) {
        runtime.handles.delete(agent.id);
      }
    }
  });
  return () => {
    for (const entry of runtime.handles.values()) {
      for (const undo of entry.guards) undo();
    }
    runtime.handles.clear();
    for (const undo of restore.reverse()) undo();
    runtimes.delete(rawAgents);
  };
}
function lifecycleFor(ctx, sessionId) {
  const agentsObj = typeof ctx.get === "function" ? ctx.get("agents") : ctx.agents;
  const rawAgents = getRaw(agentsObj);
  if (!rawAgents || typeof rawAgents !== "object") return null;
  const runtime = runtimes.get(rawAgents);
  if (!runtime) return null;
  const entry = runtime.handles.get(sessionId);
  if (!entry) return null;
  const currentAgent = rawAgents.get ? rawAgents.get(sessionId) : void 0;
  if (currentAgent && getRaw(currentAgent) !== getRaw(entry.agent)) return null;
  return { ...entry, runtime, agents: rawAgents };
}
async function withReleasedSession(ctx, sessionId, operation, options) {
  const owned = lifecycleFor(ctx, sessionId);
  if (!owned) {
    return operation();
  }
  const { handle, agent, runtime } = owned;
  const executing = agent.busy === true || agent.status === "running" || agent.session?.running === true || agent.session?.status === "running" || agent.session?.status === "ongoing";
  if (executing) {
    throw new Error("\u8BE5\u4F1A\u8BDD\u6B63\u5904\u4E8E\u6267\u884C\u6216\u8FD0\u884C\u72B6\u6001\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u79FB\u52A8\u3002");
  }
  const header = agent.session?.header;
  if (header?.origin === "subagent" || (Number(header?.delegationDepth) || 0) > 0) {
    throw new Error("\u5B50\u4EE3\u7406\uFF08subagent\uFF09\u4F1A\u8BDD\u4E0D\u652F\u6301\u8DE8\u5DE5\u4F5C\u533A\u79FB\u52A8\u3002");
  }
  runtime.moving.add(sessionId);
  let failure = void 0;
  let result;
  try {
    await handle.dispose();
    result = await operation();
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    runtime.handles.delete(sessionId);
    try {
      const controller = ctx.sessionController ?? (typeof ctx.get === "function" ? ctx.get("sessionController") : void 0);
      if (typeof controller?.resolveAgent === "function") {
        const restored = await migrationContext.run(
          runtime,
          () => controller.resolveAgent(sessionId)
        );
        if (restored?.error) {
          throw restored.error;
        }
        if (!failure && options?.targetPath && restored?.agent) {
          const workingDirectory = ctx.workingDirectory ?? (typeof ctx.get === "function" ? ctx.get("workingDirectory") : void 0);
          if (typeof workingDirectory?.set === "function") {
            await workingDirectory.set(restored.agent, options.targetPath);
          }
        }
      }
    } catch (error) {
      if (!failure) failure = error;
    } finally {
      runtime.moving.delete(sessionId);
    }
  }
  if (failure) throw failure;
  return result;
}
export {
  installSessionLifecycle,
  lifecycleFor,
  migrationInProgressError,
  withReleasedSession
};
