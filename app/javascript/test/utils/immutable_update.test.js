import update from '../../src/locomotive/editor/utils/immutable_update';

describe('locomotive/editor/utils/immutable_update', function() {

  describe('#update()', function() {

    it('should update the positions of the elements of an array', function() {
      const state = { items: ['a', 'b', 'c'] };

      const newState = update(state, {
        items: {
          $arrayMove: {
            oldIndex: 2,
            newIndex: 1
          }
        }
      });

      expect(newState).toEqual({ items: ['a', 'c', 'b'] });
      expect(state).toEqual({ items: ['a', 'b', 'c'] });
    });

  });

});
