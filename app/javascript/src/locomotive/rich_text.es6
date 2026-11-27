// The rich text editor of the back-office (Tiptap), driven by the Backbone view of the input
// (rte_view): it edits the textarea of the form, which keeps the HTML as stored until the text
// is changed. HTML the editor would change is shown as source, with a notice.
import { Editor, Extension } from '@tiptap/core';
import { extensions, toEditorHtml, toStoredHtml, keepsHtml, sanitize } from './editor/rich_text/back_office';

// an inline text (editable text on one line) has no paragraphs: Enter adds a line break
const LineBreaks = Extension.create({
  name: 'lineBreaks',
  addKeyboardShortcuts() {
    return { Enter: () => this.editor.commands.setHardBreak() };
  }
});

const ALIGN = /\s*\bwysiwyg-text-align-\w+\b/g;
const TEXT_BLOCKS = ['paragraph', 'heading'];

// the alignment is a class (wysiwyg-text-align-*) next to the other classes of the block
const align = value => ({ tr, state }) => {
  state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
    if (!TEXT_BLOCKS.includes(node.type.name)) return;
    const classes = [(node.attrs.class || '').replace(ALIGN, '').trim(), value && `wysiwyg-text-align-${value}`];
    tr.setNodeAttribute(pos, 'class', classes.filter(Boolean).join(' ') || null);
  });
  return true;
};

const tableHtml = ({ cols, rows, className, head }) => {
  const table = document.createElement('table');
  if (className) table.className = className;
  const section = (name, count, cell) => {
    const element = table.appendChild(document.createElement(name));
    for (let row = 0; row < count; row++) {
      const tr = element.appendChild(document.createElement('tr'));
      for (let col = 0; col < cols; col++) tr.appendChild(document.createElement(cell));
    }
  };
  if (head) section('thead', 1, 'th');
  section('tbody', rows, 'td');
  return table.outerHTML;
};

const create = (textarea, { inline = false, onChange = () => {}, onSelection = () => {} } = {}) => {
  const element = document.createElement('div');
  element.className = 'rte-content form-control';
  textarea.after(element);

  textarea.value = sanitize(textarea.value);
  const kept = keepsHtml(textarea.value, { inline });

  const editor = new Editor({
    element,
    extensions:  inline ? [...extensions, LineBreaks] : extensions,
    content:     toEditorHtml(textarea.value),
    onUpdate:    () => write(),
    onSelectionUpdate: () => onSelection(),
    onTransaction:     () => onSelection()
  });

  const write = () => {
    textarea.value = toStoredHtml(editor.getHTML(), { inline });
    onChange(textarea.value);
  };

  // in the source view, what runs a script is removed once the textarea is left
  textarea.addEventListener('change', () => { textarea.value = sanitize(textarea.value); });

  let source = false, before;
  const showSource = value => {
    source = value;
    textarea.style.display = source ? '' : 'none';
    element.style.display  = source ? 'none' : '';
  };
  showSource(!kept);

  const chain = () => editor.chain().focus();
  const block = () => editor.isActive('heading') ? 'heading' : 'paragraph';
  const setBlock = (type, attributes = {}) => chain().setNode(type, { ...attributes, class: editor.getAttributes(block()).class }).run();

  return {
    editor,

    get source() { return source; },

    // from the source view, the HTML typed (or not kept) goes through the editor
    toggleSource() {
      if (!source) {
        before = textarea.value;
        return showSource(true);
      }
      const html = sanitize(textarea.value);
      if (html !== before || !kept) {
        editor.commands.setContent(toEditorHtml(html), { emitUpdate: false });
        write();
      }
      showSource(false);
    },

    run(command, value) {
      switch (command) {
        case 'bold':       return chain().toggleBold().run();
        case 'italic':     return chain().toggleItalic().run();
        case 'underline':  return chain().toggleUnderline().run();
        case 'strike':     return chain().toggleStrike().run();
        case 'align':      return chain().command(align(this.isActive('align', value) ? null : value)).run();
        case 'bullets':    return chain().toggleBulletList().run();
        case 'numbers':    return chain().toggleOrderedList().run();
        case 'unlink':     return chain().extendMarkRange('link').unsetLink().run();
        case 'block':
          if (value === 'p')          return setBlock('paragraph');
          if (value === 'blockquote') return chain().toggleBlockquote().run();
          if (value === 'pre')        return chain().toggleCodeBlock().run();
          return setBlock('heading', { level: Number(value.slice(1)) });
        // editing a table
        case 'mergeCells': case 'addRowBefore': case 'addRowAfter': case 'addColumnBefore':
        case 'addColumnAfter': case 'deleteRow': case 'deleteColumn':
          return chain()[command]().run();
      }
    },

    isActive(command, value) {
      switch (command) {
        case 'align':   return (editor.getAttributes(block()).class || '').split(' ').includes(`wysiwyg-text-align-${value}`);
        case 'bullets': return editor.isActive('bulletList');
        case 'numbers': return editor.isActive('orderedList');
        default:        return editor.isActive(command);
      }
    },

    link({ href, target, title }) {
      const attributes = { href, target: target || null, title: title || null };
      if (editor.state.selection.empty && !editor.isActive('link'))
        return chain().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: attributes }] }).run();
      chain().extendMarkRange('link').setLink(attributes).run();
    },

    image(attributes) {
      if (editor.isActive('image')) return chain().updateAttributes('image', attributes).run();
      chain().setImage(attributes).run();
    },

    file({ url, title }) {
      chain().insertContent({ type: 'text', text: title || url, marks: [{ type: 'link', attrs: { href: url, title } }] }).run();
    },

    table(options) {
      chain().insertContent(tableHtml(options)).run();
    },

    text:    () => editor.getText(),
    focus:   () => editor.commands.focus(),
    destroy: () => { editor.destroy(); element.remove(); }
  };
};

window.LocomotiveRichText = { create };
