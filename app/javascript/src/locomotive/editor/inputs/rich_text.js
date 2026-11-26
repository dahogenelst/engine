import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { extensions, toStoredHtml } from '../rich_text/extensions';
import { formatLineBreak, stripHTML } from '../utils/misc';

// Components
import Toolbar from '../rich_text/toolbar';

const MIN_ROWS    = 8;
const LINE_HEIGHT = 20;

const RichTextInput = ({ setting, label, inputId, value: initialValue, onChange }) => {
  const [value, setValue] = useState(() => initialValue ?? setting.default ?? '');

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      // like before, pasted text loses its formatting (pages of other sites, Word...)
      handlePaste: (view, event) => {
        if (!event.clipboardData?.types.includes('text/html')) return false;
        return view.pasteText(event.clipboardData.getData('text/plain'));
      }
    },
    onUpdate: ({ editor }) => {
      let html = toStoredHtml(editor.getHTML());
      if (setting.line_break) html = formatLineBreak(html);
      setValue(html);
      onChange(setting.type, setting.id, html);
    }
  });

  return (
    <div className="editor-input editor-input-rich-text">
      <label className="editor-input--label" htmlFor={inputId} onClick={() => editor.commands.focus('end')}>
        {label}
      </label>
      <div className="editor-input-rich-text-wrapper">
        <Toolbar editor={editor} extended={setting.line_break !== true} />
        <EditorContent
          editor={editor}
          className="editor-input-rich-text-content"
          style={{ height: `${(setting.nb_rows || MIN_ROWS) * LINE_HEIGHT}px` }}
        />
      </div>
      <div className="editor-input-rich-text-counter">
        {stripHTML(value).length}
      </div>
    </div>
  );
};

export default RichTextInput;
