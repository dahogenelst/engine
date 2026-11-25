import { branchSize, withoutDescendants, move } from '../../../javascript/src/locomotive/editor/utils/block_tree';

const tree    = (...pairs) => pairs.map(([id, depth]) => ({ id, depth }));
const flat    = items => items.map(({ id, depth }) => [id, depth]);
const INDENT  = 20;

describe('block tree', () => {
  const menu = tree(['home', 0], ['about', 0], ['team', 1], ['jobs', 2], ['contact', 0]);

  it('counts an item with its descendants', () => {
    expect(branchSize(menu, 1)).toBe(3);
    expect(branchSize(menu, 4)).toBe(1);
  });

  it('leaves the descendants of the dragged item out of the list', () => {
    expect(flat(withoutDescendants(menu, 'about'))).toEqual([['home', 0], ['about', 0], ['contact', 0]]);
  });

  describe('move', () => {
    it('indents an item at most one level below the item above it', () => {
      const items = tree(['home', 0], ['about', 0], ['team', 0]);
      expect(flat(move(items, 'team', 'team', 2 * INDENT, INDENT, 5))).toEqual([['home', 0], ['about', 0], ['team', 1]]);
    });

    it('does not indent the first item', () => {
      const items = tree(['home', 0], ['about', 0]);
      expect(flat(move(items, 'home', 'home', 3 * INDENT, INDENT, 5))).toEqual([['home', 0], ['about', 0]]);
    });

    it('outdents an item', () => {
      const items = tree(['about', 0], ['team', 1], ['contact', 0]);
      expect(flat(move(items, 'team', 'team', -INDENT, INDENT, 5))).toEqual([['about', 0], ['team', 0], ['contact', 0]]);
    });

    it('does not outdent an item above a sibling (the sibling would lose its parent)', () => {
      const items = tree(['about', 0], ['team', 1], ['jobs', 1]);
      expect(flat(move(items, 'team', 'team', -INDENT, INDENT, 5))).toEqual([['about', 0], ['team', 1], ['jobs', 1]]);
    });

    it('moves an item with its descendants', () => {
      expect(flat(move(menu, 'about', 'contact', 0, INDENT, 5))).toEqual(
        [['home', 0], ['contact', 0], ['about', 0], ['team', 1], ['jobs', 2]]
      );
    });

    it('moves an item up and keeps the depth of its descendants relative to it', () => {
      expect(flat(move(menu, 'team', 'home', INDENT, INDENT, 5))).toEqual(
        [['team', 0], ['jobs', 1], ['home', 0], ['about', 0], ['contact', 0]]
      );
    });

    it('stops at the max depth, counting the descendants', () => {
      const items = tree(['home', 0], ['about', 1], ['team', 0], ['jobs', 1]);
      // team would become a child of about (depth 2), which makes jobs depth 3 > max 2
      expect(flat(move(items, 'team', 'team', 5 * INDENT, INDENT, 2))).toEqual(
        [['home', 0], ['about', 1], ['team', 1], ['jobs', 2]]
      );
    });

    it('keeps a flat list flat (max depth 0)', () => {
      const items = tree(['home', 0], ['about', 0]);
      expect(flat(move(items, 'about', 'about', 3 * INDENT, INDENT, 0))).toEqual([['home', 0], ['about', 0]]);
    });
  });
});
