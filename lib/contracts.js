function strictCodec(typeSymbol, schema) {
  return { mode: "strict", typeSymbol, create: () => schema, schema };
}
function archiveCodec(name, schema) {
  return strictCodec(`@michengai/dsh-archive-manager/types#${name}`, schema);
}
function remoteInvocation(method, { parameters = [], result }) {
  return {
    id: `@michengai/dsh-archive-manager#workspaceRegistry/${method}`,
    service: "workspaceRegistry",
    namespace: "workspaceRegistry",
    method,
    invocation: { kind: "direct" },
    parameters,
    result,
    sourceLocation: { file: "@michengai/dsh-archive-manager/lib/workspace.js", line: 1, column: 1 }
  };
}
function record(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("\u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61");
  return value;
}
function errorMessage(error) {
  return String(error && typeof error === "object" && "message" in error ? error.message ?? error : error);
}
function errorCode(error) {
  return error && typeof error === "object" && "code" in error ? error.code : void 0;
}
export {
  archiveCodec,
  errorCode,
  errorMessage,
  record,
  remoteInvocation,
  strictCodec
};
