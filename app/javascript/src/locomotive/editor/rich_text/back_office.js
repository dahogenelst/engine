// The rich text editor of the back-office (html fields of content entries, editable texts,
// site metafields) on Tiptap, reading and writing the HTML the previous editor (wysihtml5) stored:
// its tags (b and strong, i and em...), the classes it used (wysiwyg-text-align-*, wysiwyg-float-*),
// ids, classes and data-* attributes, images, tables and embeds. What Tiptap cannot keep is
// detected by keepsHtml, so that HTML can be edited as source instead of being changed silently.
import { Extension, Mark, Node } from '@tiptap/core';
import { generateHTML, generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

// a mark stored with the tag it was written with (<b> or <strong>...); new marks get the first tag
const keepTag = (extension, tags) => extension.extend({
  addAttributes() {
    return { ...this.parent?.(), tag: { default: tags[0], rendered: false } };
  },
  parseHTML: () => tags.map(tag => ({ tag, getAttrs: () => ({ tag }) })),
  renderHTML: ({ mark, HTMLAttributes }) => [mark.attrs.tag, HTMLAttributes, 0]
});

// data-* attributes, kept together
const data = {
  default: null,
  parseHTML: element => {
    const attributes = Array.from(element.attributes).filter(({ name }) => name.startsWith('data-'));
    return attributes.length ? Object.fromEntries(attributes.map(({ name, value }) => [name, value])) : null;
  },
  renderHTML: ({ data }) => data || {}
};

const Attributes = Extension.create({
  name: 'backOfficeAttributes',
  addGlobalAttributes: () => [
    {
      types: ['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'div', 'span',
        'table', 'tableRow', 'tableCell', 'tableHeader', 'image', 'iframe', 'italic'],
      attributes: { id: { default: null }, class: { default: null } }
    },
    { types: ['link'], attributes: { id: { default: null } } }, // it has its class already
    { types: ['div', 'span', 'link'], attributes: { data } },
    { types: ['blockquote'], attributes: { cite: { default: null } } }
  ]
});

const Div = Node.create({
  name: 'div',
  group: 'block',
  content: 'block+',
  parseHTML: () => [{ tag: 'div' }],
  renderHTML: ({ HTMLAttributes }) => ['div', HTMLAttributes, 0]
});

const Span = Mark.create({
  name: 'span',
  parseHTML: () => [{ tag: 'span' }],
  renderHTML: ({ HTMLAttributes }) => ['span', HTMLAttributes, 0]
});

const Iframe = Node.create({
  name: 'iframe',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => Object.fromEntries(
    ['width', 'height', 'src', 'frameborder', 'allowfullscreen'].map(name => [name, { default: null }])
  ),
  parseHTML: () => [{ tag: 'iframe' }],
  renderHTML: ({ HTMLAttributes }) => ['iframe', HTMLAttributes]
});

// rows keep their section (thead, tbody, tfoot), regrouped by toStoredHtml
const Row = TableRow.extend({
  addAttributes: () => ({
    section: {
      default: 'tbody',
      parseHTML: element => ['THEAD', 'TFOOT'].includes(element.parentElement?.tagName) ? element.parentElement.tagName.toLowerCase() : 'tbody',
      renderHTML: ({ section }) => ({ 'data-section': section })
    }
  })
});

export const extensions = [
  StarterKit.configure({
    link:         { openOnClick: false, autolink: false, HTMLAttributes: { target: null, rel: null } },
    underline:    { HTMLAttributes: {} },
    dropcursor:   false,
    gapcursor:    false,
    trailingNode: false
  }).extend({
    addExtensions() {
      return this.parent().map(extension => {
        switch (extension.name) {
          case 'bold':      return keepTag(extension, ['strong', 'b']);
          case 'italic':    return keepTag(extension, ['i', 'em']);
          case 'underline': return keepTag(extension, ['u', 'ins']);
          case 'strike':    return keepTag(extension, ['strike', 's', 'del']);
          case 'codeBlock': return extension.extend({ renderHTML: ({ HTMLAttributes }) => ['pre', HTMLAttributes, 0] });
          default:          return extension;
        }
      });
    }
  }),
  Attributes, Div, Span, Iframe,
  Image.configure({ inline: true }),
  Table.configure({ resizable: false, renderWrapper: false }).extend({
    renderHTML: ({ HTMLAttributes }) => ['table', HTMLAttributes, ['tbody', 0]] // no colgroup nor width
  }),
  Row, TableHeader, TableCell
];

// the order of the attributes wysihtml5 wrote (its parser rules), so stored HTML comes back as it was
const ORDER = {
  a:          ['id', 'target', 'href', 'title', 'class', 'data-*', 'rel'],
  img:        ['id', 'class', 'width', 'title', 'alt', 'src', 'height'],
  iframe:     ['id', 'class', 'width', 'height', 'src', 'frameborder', 'allowfullscreen'],
  td:         ['id', 'class', 'rowspan', 'colspan'],
  th:         ['id', 'class', 'rowspan', 'colspan'],
  blockquote: ['id', 'class', 'cite']
};
const DEFAULT_ORDER = ['id', 'class', 'data-*'];
const rank = (order, name) => {
  const index = order.indexOf(name.startsWith('data-') ? 'data-*' : name);
  return index === -1 ? order.length : index;
};

// The HTML Tiptap gives, written the way it was stored. With inline (editable texts on one line),
// the text is not wrapped in a paragraph.
export const toStoredHtml = (html, { inline = false } = {}) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const content = template.content;

  // Tiptap keeps the text of a list item, a quote or a cell in a paragraph, wysihtml5 did not
  content.querySelectorAll('li, blockquote, td, th').forEach(element => {
    const paragraphs = Array.from(element.children).filter(child => child.tagName === 'P');
    if (paragraphs.length === 1 && element.firstElementChild === paragraphs[0] && !paragraphs[0].attributes.length)
      paragraphs[0].replaceWith(...paragraphs[0].childNodes);
  });

  content.querySelectorAll('table').forEach(table => {
    const rows = Array.from(table.querySelectorAll(':scope > tbody > tr'));
    let section = null;
    table.replaceChildren();
    rows.forEach(row => {
      const name = row.dataset.section;
      row.removeAttribute('data-section');
      if (section?.localName !== name) table.append(section = document.createElement(name));
      section.append(row);
    });
  });

  content.querySelectorAll('*').forEach(element => {
    const order      = ORDER[element.localName] || DEFAULT_ORDER;
    const attributes = Array.from(element.attributes).map(({ name, value }) => [name, value]);
    attributes.sort(([a], [b]) => rank(order, a) - rank(order, b)); // stable: the rest keeps its order
    attributes.forEach(([name]) => element.removeAttribute(name));
    attributes.forEach(([name, value]) => element.setAttribute(name, value));
  });

  if (inline && content.childNodes.length === 1 && content.firstChild.tagName === 'P' && !content.firstChild.attributes.length)
    content.firstChild.replaceWith(...content.firstChild.childNodes);

  return template.innerHTML;
};

// HTML as the browser sees it: the order of the attributes and the spaces between blocks do not matter
const normalize = html => {
  const template = document.createElement('template');
  template.innerHTML = html.replace(/>\s+</g, '><').trim();
  template.content.querySelectorAll('*').forEach(element => {
    const attributes = Array.from(element.attributes).map(({ name, value }) => [name, value]).sort();
    attributes.forEach(([name]) => element.removeAttribute(name));
    attributes.forEach(([name, value]) => element.setAttribute(name, value));
  });
  return template.innerHTML;
};

export const roundtrip = (html, options) =>
  toStoredHtml(generateHTML(generateJSON(html, extensions), extensions), options);

// Can the editor open this HTML without changing it? If not, it is edited as source.
export const keepsHtml = (html, options) => normalize(roundtrip(html, options)) === normalize(html);
