// While dragging, the preview iframe must not swallow the pointer events (a release over it
// would never reach the editor and the drag would not end).
export const draggingHandlers = {
  onDragStart:  () => document.body.classList.add('editor-dragging'),
  onDragEnd:    () => document.body.classList.remove('editor-dragging'),
  onDragCancel: () => document.body.classList.remove('editor-dragging')
};
