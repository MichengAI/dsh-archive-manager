import type { BatchTarget, RowDrag, ArchiveProps } from "../../src/client-types.js";
import type { RemoteResult, Registry } from "../../src/client-compat.js";

// 这些负例随 typecheck 编译；如果契约退化，未使用的预期错误会让构建失败。
const selected: BatchTarget = { scope: "sessions", sessionIds: ["会话一"] };
void selected;
// @ts-expect-error 项目范围必须指定项目标识。
const missingWorkspace: BatchTarget = { scope: "workspace" };
// @ts-expect-error 会话标识必须为字符串。
const numericId: BatchTarget = { scope: "sessions", sessionIds: [42] };
// @ts-expect-error 不允许未定义的批量范围。
const invalidScope: BatchTarget = { scope: "everything" };
void [missingWorkspace, numericId, invalidScope];

function remoteContract(registry: Registry, result: RemoteResult<string>, props: ArchiveProps, drag: RowDrag) {
  registry.sessionDetails({ sessionIds: ["会话一"] });
  // @ts-expect-error 详情请求必须传入会话集合。
  registry.sessionDetails({ sessionId: "会话一" });
  // @ts-expect-error 收藏状态必须是布尔值。
  registry.setSessionFavorite({ sessionId: "会话一", favorite: "是" });
  // @ts-expect-error 失败结果不能读取成功值，必须先检查 ok。
  result.value;
  if (result.ok) result.value.toUpperCase();
  else result.error.message.toUpperCase();
  // @ts-expect-error 打开会话必须使用字符串标识。
  props.openConversation(42);
  // @ts-expect-error 拖拽落点只允许前后位置。
  drag.drop("middle");
}
void remoteContract;
