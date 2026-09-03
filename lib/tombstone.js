function trackTombstone(ids, order, id, limit) {
  if (!ids.has(id)) {
    ids.add(id);
    order.push(id);
  }
  const evicted = [];
  while (order.length > limit) {
    const oldest = order.shift();
    if (oldest !== void 0 && oldest !== id) {
      ids.delete(oldest);
      evicted.push(oldest);
    }
  }
  return evicted;
}
export {
  trackTombstone
};
