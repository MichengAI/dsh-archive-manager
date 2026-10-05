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
  errorCode,
  errorMessage,
  record
};
