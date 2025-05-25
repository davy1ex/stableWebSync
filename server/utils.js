function toBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return !!val;
}

function compareUpdatedAt(a, b) {
  if (!a || !b) return true;
  return new Date(a) > new Date(b);
}

function mergeTasks(oldTasks, newTasks) {
  const map = new Map();
  for (const t of oldTasks) map.set(t.taskId, t);
  for (const t of newTasks) {
    const existing = map.get(t.taskId);
    if (!existing || compareUpdatedAt(t.updatedAt, existing.updatedAt)) {
      map.set(t.taskId, t);
    }
  }
  return Array.from(map.values());
}

module.exports = { toBoolean, compareUpdatedAt, mergeTasks }; 