// The rich text editor (Tiptap) is set up to read and write the same HTML the previous
// editor (draft-js) stored, so existing content keeps its markup and the sites their styling.
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';

const ALIGNABLE = ['heading', 'paragraph', 'listItem']; // draft-js aligned list items too

export const extensions = [
  StarterKit.configure({
    underline:  { HTMLAttributes: {} },
    link:       { openOnClick: false, autolink: false, HTMLAttributes: { target: null, rel: null } },
    dropcursor: false,
    gapcursor:  false,
    trailingNode: false
  }).extend({
    addExtensions() {
      // stored as <ins>, <del> and <pre>text</pre> (draft-js), read in any of the usual forms
      return this.parent().map(extension => {
        switch (extension.name) {
          case 'underline':
            return extension.extend({
              parseHTML: () => [{ tag: 'ins' }, { tag: 'u' }],
              renderHTML: ({ HTMLAttributes }) => ['ins', HTMLAttributes, 0]
            });
          case 'strike':
            return extension.extend({
              parseHTML: () => [{ tag: 'del' }, { tag: 's' }, { tag: 'strike' }],
              renderHTML: ({ HTMLAttributes }) => ['del', HTMLAttributes, 0]
            });
          case 'codeBlock':
            return extension.extend({
              renderHTML: ({ HTMLAttributes }) => ['pre', HTMLAttributes, 0]
            });
          default:
            return extension;
        }
      });
    }
  }),
  TextAlign.configure({ types: ALIGNABLE }).extend({
    addGlobalAttributes() {
      return [{
        types: ALIGNABLE,
        attributes: {
          textAlign: {
            default:    null,
            parseHTML:  element => element.style.textAlign || null,
            renderHTML: ({ textAlign }) => textAlign ? { style: `text-align:${textAlign};` } : {}
          }
        }
      }];
    }
  })
];

// Tiptap keeps the text of a list item or a quote in a paragraph; the stored HTML does not
// (<li>text</li>, <blockquote>text</blockquote>), so a lone paragraph is unwrapped.
// Each block ends a line, like before (the line_break option relies on "</p>\n<p>").
export const toStoredHtml = html => {
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll('li, blockquote').forEach(element => {
    const paragraphs = Array.from(element.children).filter(child => child.tagName === 'P');
    if (paragraphs.length === 1 && element.firstElementChild === paragraphs[0])
      paragraphs[0].replaceWith(...paragraphs[0].childNodes);
  });

  // written like before: "text-align:center;" and the href of a link first
  template.content.querySelectorAll('[style]').forEach(element =>
    element.setAttribute('style', element.getAttribute('style').replace(/:\s+/g, ':')));
  template.content.querySelectorAll('a[target]').forEach(link => {
    const target = link.getAttribute('target');
    link.removeAttribute('target');
    link.setAttribute('target', target);
  });

  return template.innerHTML
    .replace(/<(ul|ol)\b[^>]*>|<\/(p|h[1-6]|blockquote|pre|li|ul|ol)>/g, '$&\n');
};
