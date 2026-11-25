import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Components
import Block from './block';

// Services
import { findBetterImageAndText } from '../../../services/blocks_service';
import { withoutDescendants, project, move } from '../../../utils/block_tree';
import { draggingHandlers } from '../../../utils/dragging';

const INDENTATION = 20; // px per level

const buildItems = props => {
  return (props.sectionContent.blocks || []).map(block => {
    const definition = props.sectionDefinition.blocks.find(def => def.type === block.type)

    if (definition === null || definition === undefined) return null;
    var { image, text } = findBetterImageAndText(block, definition)

    // we don't want the blocks to all have the same text
    if (text === null && block.index)
      text = `${definition.name} #${block.index}`

    return {
      block,
      text,
      image,
      id:              block.id,
      depth:           block.depth || 0,
      blockDefinition: definition,
      editPath:        props.editBlockPath(props.section, block.type, block.id)
    }
  });
}

const SortableBlock = ({ item, depth }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  // only vertical on screen: moving sideways changes the depth instead
  const style = { transform: CSS.Transform.toString(transform && { ...transform, x: 0 }), transition };

  return (
    <div ref={setNodeRef} style={{ ...style, ...(isDragging ? { position: 'relative', zIndex: 1 } : {}) }}>
      <div style={{ marginLeft: depth * INDENTATION }}>
        <Block isDragging={isDragging} handleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }} {...item} />
      </div>
    </div>
  );
};

const BlockList = props => {
  const items   = buildItems(props);
  const sensors = useSensors(useSensor(PointerSensor));
  const [drag, setDrag] = useState(null); // { activeId, overId, offsetX }

  // while dragging, the descendants of the dragged block are hidden and it shows the depth it will get
  const visible   = drag ? withoutDescendants(items, drag.activeId) : items;
  const projected = drag && project(items, drag.activeId, drag.overId, drag.offsetX, INDENTATION, props.maxDepth).depth;

  const onDragEnd = ({ active, over, delta }) => {
    draggingHandlers.onDragEnd();
    setDrag(null);
    const sorted = move(items, active.id, over ? over.id : active.id, delta.x, INDENTATION, props.maxDepth);
    if (sorted.some((item, index) => item.id !== items[index].id || item.depth !== items[index].depth))
      props.moveBlock(sorted.map(item => ({ ...item.block, depth: item.depth })));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => { draggingHandlers.onDragStart(); setDrag({ activeId: active.id, overId: active.id, offsetX: 0 }); }}
      onDragMove={({ active, over, delta }) => setDrag({ activeId: active.id, overId: over ? over.id : active.id, offsetX: delta.x })}
      onDragEnd={onDragEnd}
      onDragCancel={() => { draggingHandlers.onDragCancel(); setDrag(null); }}
    >
      <SortableContext items={visible.map(item => item.id)} strategy={verticalListSortingStrategy}>
        {visible.map(item => (
          <SortableBlock key={item.id} item={item} depth={drag && item.id === drag.activeId ? projected : item.depth} />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default BlockList;
