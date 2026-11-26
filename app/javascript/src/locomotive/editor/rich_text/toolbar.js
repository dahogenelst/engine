import React from 'react';
import { useEditorState } from '@tiptap/react';
import classnames from 'classnames';

// Components
import Link from './link';

// [title, icon, is it active?, command] — the titles are the ones of the previous editor
const MARKS = [
  ['Bold',          'bold',          'bold'],
  ['Italic',        'italic',        'italic'],
  ['Underline',     'underline',     'underline'],
  ['Strikethrough', 'strikethrough', 'strike']
].map(([title, icon, mark]) => [title, icon, editor => editor.isActive(mark), chain => chain.toggleMark(mark)]);

const ALIGNMENTS = ['left', 'center', 'right', 'justify'].map(align => [
  align[0].toUpperCase() + align.slice(1), `align-${align}`, editor => editor.isActive({ textAlign: align }), chain => chain.setTextAlign(align)
]);

const LISTS = [
  ['Unordered', 'list-ul', editor => editor.isActive('bulletList'),  chain => chain.toggleBulletList()],
  ['Ordered',   'list-ol', editor => editor.isActive('orderedList'), chain => chain.toggleOrderedList()]
];

// like before, a block has one type: a list item becomes a heading, a quote a paragraph...
const BLOCK_TYPES = [
  ['H1', 'heading', { level: 1 }], ['H2', 'heading', { level: 2 }], ['H3', 'heading', { level: 3 }],
  ['H4', 'heading', { level: 4 }], ['H5', 'heading', { level: 5 }], ['H6', 'heading', { level: 6 }],
  ['Blockquote', 'blockquote'], ['Code', 'codeBlock'], ['Normal', 'paragraph']
];
const setBlockType = (editor, name, attributes) => {
  // clearNodes drops the alignment
  const textAlign = editor.getAttributes('paragraph').textAlign ?? editor.getAttributes('heading').textAlign;
  const chain = editor.chain().focus().clearNodes();
  switch (name) {
    case 'blockquote': return chain.setBlockquote().run();
    case 'codeBlock':  return chain.setCodeBlock().run();
    default:           return chain.setNode(name, { ...attributes, textAlign }).run();
  }
};

const Button = ({ editor, title, icon, active, command }) => (
  <button
    type="button"
    title={title}
    className={classnames('editor-rich-text-toolbar--button', active && 'editor-rich-text-toolbar--button-active')}
    aria-pressed={active}
    onClick={() => command(editor.chain().focus()).run()}
  >
    <i className={`fas fa-${icon}`}></i>
  </button>
);

const Toolbar = ({ editor, extended }) => {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      marks:      MARKS.map(([, , isActive]) => isActive(editor)),
      alignments: ALIGNMENTS.map(([, , isActive]) => isActive(editor)),
      lists:      LISTS.map(([, , isActive]) => isActive(editor)),
      blockType:  BLOCK_TYPES.find(([, name, attributes]) => editor.isActive(name, attributes))?.[0] || 'Normal'
    })
  });

  const group = (buttons, actives) => (
    <div className="editor-rich-text-toolbar--group">
      {buttons.map(([title, icon, , command], index) => (
        <Button key={title} editor={editor} title={title} icon={icon} active={actives[index]} command={command} />
      ))}
    </div>
  );

  return (
    <div className="editor-rich-text-toolbar">
      {group(MARKS, state.marks)}
      {extended && group(ALIGNMENTS, state.alignments)}
      {extended && (
        <div className="editor-rich-text-toolbar--group">
          <select
            title="Block Type"
            value={state.blockType}
            onChange={event => {
              const [, name, attributes] = BLOCK_TYPES.find(([label]) => label === event.target.value);
              setBlockType(editor, name, attributes);
            }}
          >
            {BLOCK_TYPES.map(([label]) => <option key={label} value={label}>{label}</option>)}
          </select>
        </div>
      )}
      {extended && group(LISTS, state.lists)}
      <Link editor={editor} />
    </div>
  );
};

export default Toolbar;
