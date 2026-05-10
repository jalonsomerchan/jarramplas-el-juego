export function trimRuntimeArray(items, maxItems) {
  if (items.length > maxItems) items.splice(0, items.length - maxItems);
}

export function createRuntimeLimiter({ state, limits }) {
  return function enforceRuntimeLimits() {
    trimRuntimeArray(state.people, limits.people);
    trimRuntimeArray(state.turnips, limits.turnips);
    trimRuntimeArray(state.floaters, limits.floaters);
    trimRuntimeArray(state.particles, limits.particles);
  };
}
