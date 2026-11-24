import { AsyncLocalStorage } from "node:async_hooks";
import { symbols } from "@deepseek-ai/cordis";
import type { SessionMoveContext } from "./session-move.js";

export interface AgentLike {
	id: string;
	status?: string;
	busy?: boolean;
	session?: {
		id: string;
		running?: boolean;
		status?: string;
		header?: {
			origin?: string;
			cwd?: string;
			delegationDepth?: number;
			[key: string]: unknown;
		};
		[key: string]: unknown;
	};
	send?: (...args: unknown[]) => unknown;
	followup?: (...args: unknown[]) => unknown;
	runMaintenance?: (...args: unknown[]) => unknown;
	steer?: (...args: unknown[]) => unknown;
	inject?: (...args: unknown[]) => unknown;
	[key: string]: unknown;
}

export interface AgentHandle {
	agent?: AgentLike;
	dispose(): Promise<void> | void;
}

export interface LifecycleEntry {
	handle: AgentHandle;
	agent: AgentLike;
	guards: (() => void)[];
}

export interface LifecycleRuntime {
	handles: Map<string, LifecycleEntry>;
	moving: Set<string>;
}

const runtimes = new WeakMap<object, LifecycleRuntime>();
export const migrationContext = new AsyncLocalStorage<LifecycleRuntime>();

function getRaw<T>(value: T): T {
	if (value && typeof value === "object") {
		const original = Reflect.get(value, symbols.original);
		if (original !== null && typeof original === "object") return original as T;
	}
	return value;
}

export function migrationInProgressError(): Error & { code?: string } {
	const err = new Error("该会话正在跨工作区移动中，请稍后重试。");
	(err as { code?: string }).code = "migration-in-progress";
	return err;
}

/**
 * 安装会话生命周期监听，捕获宿主通过 create/resume 返回的官方 AgentHandle。
 * 允许在跨工作区迁移时安全注销/释放会话，并在迁移期间拦截并发消息输入。
 */
export function installSessionLifecycle(owner: {
	agents?: unknown;
	get?(name: string): unknown;
	on?(event: string, listener: (...args: unknown[]) => void): void;
}): () => void {
	const agentsObj = (typeof owner.get === "function" ? owner.get("agents") : owner.agents) as
		| {
				create?: (...args: unknown[]) => Promise<AgentHandle>;
				resume?: (...args: unknown[]) => Promise<AgentHandle>;
				get?: (id: string) => unknown;
		  }
		| undefined;
	const rawAgents = getRaw(agentsObj);
	if (!rawAgents || typeof rawAgents !== "object") return () => {};
	if (runtimes.has(rawAgents)) return () => {};

	const runtime: LifecycleRuntime = { handles: new Map(), moving: new Set() };
	runtimes.set(rawAgents, runtime);
	const restore: (() => void)[] = [];

	for (const method of ["create", "resume"] as const) {
		const originalMethod = rawAgents[method];
		if (typeof originalMethod !== "function") continue;

		const wrapped = async function (this: unknown, options?: { sessionId?: string; resumeSessionId?: string }, ...args: unknown[]) {
			const id = options?.sessionId ?? options?.resumeSessionId;
			if (id && runtime.moving.has(id) && migrationContext.getStore() !== runtime) {
				throw migrationInProgressError();
			}
			const handle = await Reflect.apply(originalMethod as (...a: unknown[]) => Promise<AgentHandle>, this, [options, ...args]);
			const agent = getRaw(handle?.agent) as AgentLike | undefined;
			if (agent?.id && typeof handle?.dispose === "function") {
				const guards: (() => void)[] = [];
				runtime.handles.set(agent.id, { handle, agent, guards });

				for (const actionName of ["send", "followup", "runMaintenance", "steer", "inject"] as const) {
					const action = agent[actionName];
					if (typeof action !== "function") continue;
					const guarded = function (this: unknown, ...params: unknown[]) {
						if (
							(runtime.moving.has(agent.id) && migrationContext.getStore() !== runtime) ||
							getRaw(rawAgents.get?.(agent.id)) !== agent
						) {
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

		(rawAgents as Record<string, unknown>)[method] = wrapped;
		restore.push(() => {
			if (rawAgents[method] === wrapped) rawAgents[method] = originalMethod;
		});
	}

	owner.on?.("agent/disposed", (payload: unknown) => {
		const agent = getRaw((payload as { agent?: { id?: string } })?.agent);
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

export function lifecycleFor(
	ctx: { agents?: unknown; get?(name: string): unknown },
	sessionId: string
): (LifecycleEntry & { runtime: LifecycleRuntime; agents: unknown }) | null {
	const agentsObj = (typeof ctx.get === "function" ? ctx.get("agents") : ctx.agents) as
		| { get?(id: string): unknown }
		| undefined;
	const rawAgents = getRaw(agentsObj);
	if (!rawAgents || typeof rawAgents !== "object") return null;
	const runtime = runtimes.get(rawAgents);
	if (!runtime) return null;
	const entry = runtime.handles.get(sessionId);
	if (!entry) return null;
	const currentAgent = rawAgents.get ? rawAgents.get(sessionId) : undefined;
	if (!currentAgent || getRaw(currentAgent) !== getRaw(entry.agent)) return null;
	return { ...entry, runtime, agents: rawAgents };
}

/**
 * 包装会话移动操作：若会话为已捕获且处于空闲的驻留会话，先通过官方句柄释放，
 * 待物理迁移完成后在目标工作区以原 ID 重新 resolveAgent，并同步更新有效工作目录。
 */
export async function withReleasedSession<T>(
	ctx: SessionMoveContext,
	sessionId: string,
	operation: () => Promise<T>,
	options?: { targetPath?: string }
): Promise<T> {
	const owned = lifecycleFor(ctx as { agents?: unknown; get?(name: string): unknown }, sessionId);
	if (!owned) {
		return operation();
	}

	const controller =
		ctx.sessionController ??
		(typeof (ctx as unknown as { get?: (k: string) => unknown }).get === "function"
			? ((ctx as unknown as { get: (k: string) => unknown }).get("sessionController") as SessionMoveContext["sessionController"])
			: undefined);

	// 若宿主未提供 sessionController.resolveAgent，则无法在移动后安全重新拉起会话。
	// 为避免会话被 dispose 后变成孤儿，退回普通 operation 分支（由内部检查抛出“会话仍处于打开或运行状态，请先关闭该会话后再移动。”）
	if (typeof controller?.resolveAgent !== "function") {
		return operation();
	}

	const { handle, agent, runtime } = owned;
	const executing =
		agent.busy === true ||
		agent.status === "running" ||
		agent.session?.running === true ||
		agent.session?.status === "running" ||
		agent.session?.status === "ongoing";

	if (executing) {
		throw new Error("该会话正处于执行或运行状态，请等待完成后再移动。");
	}

	const header = agent.session?.header;
	if (header?.origin === "subagent" || (Number(header?.delegationDepth) || 0) > 0) {
		throw new Error("子代理（subagent）会话不支持跨工作区移动。");
	}

	runtime.moving.add(sessionId);
	let failure: unknown = undefined;
	let result: T;

	try {
		await handle.dispose();
		result = await operation();
	} catch (error) {
		failure = error;
		throw error;
	} finally {
		runtime.handles.delete(sessionId);
		try {
			if (typeof controller?.resolveAgent === "function") {
				const restored = (await migrationContext.run(runtime, () =>
					controller.resolveAgent!(sessionId)
				)) as { agent?: AgentLike; error?: unknown } | undefined;

				if (restored?.error) {
					throw restored.error;
				}

				// 双保险：新 Agent 恢复后立即解除 moving 标记（物理排他期已过），即使后续 set 异常也能确保状态干净
				runtime.moving.delete(sessionId);

				if (!failure && options?.targetPath && restored?.agent) {
					const workingDirectory =
						ctx.workingDirectory ??
						(typeof (ctx as unknown as { get?: (k: string) => unknown }).get === "function"
							? ((ctx as unknown as { get: (k: string) => unknown }).get("workingDirectory") as SessionMoveContext["workingDirectory"])
							: undefined);

					if (typeof workingDirectory?.set === "function") {
						await migrationContext.run(runtime, () =>
							workingDirectory.set!(restored.agent!, options.targetPath!)
						);
					}
				}
			}
		} catch (error) {
			if (!failure) {
				// 若 operation() 已经成功落盘，后续目标重新挂接或目录同步异常降级为 warning，不将成功的移动篡改为失败
				ctx.logger?.warn?.(
					`[archive-manager] 会话 ${sessionId} 跨工作区移动已落盘，但在目标工作区重新挂接或同步目录异常: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		} finally {
			runtime.moving.delete(sessionId);
		}
	}

	if (failure) throw failure;
	return result!;
}
