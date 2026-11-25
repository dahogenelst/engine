// The blocks of a section displayed as a tree: a flat list in tree order where
// each item has a depth (0 = root). A block is moved with its descendants.

// the item at index and the items below it that are deeper (its descendants)
export const branchSize = (items, index) => {
  let size = 1;
  while (items[index + size] && items[index + size].depth > items[index].depth) size++;
  return size;
}

// the list as it looks while dragging: the descendants of the dragged item are left out
export const withoutDescendants = (items, activeId) => {
  const index = items.findIndex(item => item.id === activeId);
  return [...items.slice(0, index + 1), ...items.slice(index + branchSize(items, index))];
}

// Where the dragged item lands (over the item with overId, offsetX pixels sideways)
// and at which depth: at most one deeper than the item above it, not shallower than
// the item below it (which would leave that one without its parent) and, with its
// descendants, not deeper than maxDepth.
export const project = (items, activeId, overId, offsetX, indentation, maxDepth) => {
  const index       = items.findIndex(item => item.id === activeId);
  const branch      = items.slice(index, index + branchSize(items, index));
  const branchDepth = Math.max(...branch.map(item => item.depth)) - branch[0].depth;

  const list    = withoutDescendants(items, activeId);
  const from    = list.findIndex(item => item.id === activeId);
  const to      = list.findIndex(item => item.id === overId);
  const moved   = list.filter(item => item.id !== activeId);
  moved.splice(to === -1 ? from : to, 0, list[from]);

  const newIndex  = moved.findIndex(item => item.id === activeId);
  const previous  = moved[newIndex - 1];
  const next      = moved[newIndex + 1];
  const max       = Math.min(previous ? previous.depth + 1 : 0, maxDepth - branchDepth);
  const min       = next ? next.depth : 0;
  const wanted    = branch[0].depth + Math.round(offsetX / indentation);
  const depth     = Math.max(Math.min(wanted, max), Math.min(min, max));

  return { list: moved, index: newIndex, depth, branch };
}

// the new flat list once the dragged item is dropped
export const move = (items, activeId, overId, offsetX, indentation, maxDepth) => {
  const { list, index, depth, branch } = project(items, activeId, overId, offsetX, indentation, maxDepth);
  const shift = depth - branch[0].depth;
  const moved = branch.map(item => ({ ...item, depth: item.depth + shift }));
  return [...list.slice(0, index), ...moved, ...list.slice(index + 1)];
}
