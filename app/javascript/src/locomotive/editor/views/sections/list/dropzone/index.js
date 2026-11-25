import React, { Component } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { draggingHandlers } from '../../../../utils/dragging';
import { bindAll } from 'lodash';
import i18n from '../../../../i18n';

// Services
import { findBetterImageAndText } from '../../../../services/sections_service';

// Components
import { SlideLeftLink } from '../../../../components/links';
import Section from './section';

const lockVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });

const SortableSection = props => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: props.section.id });

  return (
    <Section
      {...props}
      nodeRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, ...(isDragging ? { position: 'relative', zIndex: 1 } : {}) }} // above its siblings while dragged
      handleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }}
    />
  );
}

const SortableList = ({ list, onSortEnd, ...props }) => {
  const sensors = useSensors(useSensor(PointerSensor));
  const ids     = (list || []).map(section => section.id);

  const onDragEnd = ({ active, over }) => {
    draggingHandlers.onDragEnd();
    if (over && active.id !== over.id)
      onSortEnd({ oldIndex: ids.indexOf(active.id), newIndex: ids.indexOf(over.id) });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[lockVerticalAxis]} onDragStart={draggingHandlers.onDragStart} onDragCancel={draggingHandlers.onDragCancel} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div>
          {(list || []).map(section => {
            const definition        = props.findSectionDefinition(section.type);
            const { image, text }   = findBetterImageAndText(section, definition)

            return (
              <SortableSection
                key={`section-${section.id}`}
                image={image}
                text={text}
                section={section}
                definition={definition}
                editPath={props.editSectionPath(section)}
              />
            )}
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export class Dropzone extends Component {

  constructor(props) {
    super(props);
    bindAll(this, 'onSortEnd');
  }

  onSortEnd({ oldIndex, newIndex }) {
    this.props.moveSection(
      oldIndex,
      newIndex,
      this.props.list[oldIndex],
      this.props.list[newIndex]
    );
  }

  render() {
    return (
      <div className="editor-section-list">
        <SortableList
          list={this.props.list}
          {...this.props}
          onSortEnd={this.onSortEnd}
        />

        <div className="editor-list-add">
          <SlideLeftLink to={this.props.newSectionPath()} className="editor-list-add--button">
            {i18n.t('views.sections.dropzone.add')}
          </SlideLeftLink>
        </div>
      </div>
    )
  }

}

export default Dropzone;
