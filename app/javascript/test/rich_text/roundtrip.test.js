import { generateJSON, generateHTML } from '@tiptap/html';
import { ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

import { extensions, toStoredHtml } from '../../../javascript/src/locomotive/editor/rich_text/extensions';
import { formatLineBreak } from '../../../javascript/src/locomotive/editor/utils/misc';

// HTML exactly as the section editor (draft-js) stored it. Opening it in the new editor and
// saving it again must give the same HTML, or existing content and the site styling change.
const LINK = 'http://locomotive.local/locomotive/acme/preview/_locomotive-link/eyJ0eXBlIjoicGFnZSIsInZhbHVlIjoiNDIifQ==';
const STORED = {
  paragraphs:       '<p>Hello world</p>\n<p>Second &amp; last</p>\n',
  inline:           '<p><strong>bold</strong> <em>italic</em> <ins>underline</ins> <del>strike</del> <strong><em>both</em></strong></p>\n',
  alignment:        '<p style="text-align:center;">centered</p>\n<p style="text-align:right;">right</p>\n<p style="text-align:justify;">justified</p>\n',
  headings:         '<h1>One</h1>\n<h2>Two</h2>\n<h3>Three</h3>\n<h4>Four</h4>\n<h5>Five</h5>\n<h6>Six</h6>\n<blockquote>Quote</blockquote>\n<pre>code</pre>\n',
  aligned_heading:  '<h2 style="text-align:center;">Centered title</h2>\n',
  lists:            '<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n<ol>\n<li>first</li>\n<li>second</li>\n</ol>\n',
  links:            `<p><a href="${LINK}" target="_blank">to a page</a> and <a href="https://example.com" target="_self">external</a></p>\n`,
  entities:         '<p>café &lt;tag&gt; a b "quote"</p>\n',
  empty:            '<p></p>\n'
};

const draft     = html => { const { contentBlocks, entityMap } = htmlToDraft(html); return draftToHtml(convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap))); };
const tiptap    = html => toStoredHtml(generateHTML(generateJSON(html, extensions), extensions));
// equal the way a browser sees it: newlines between blocks, the order of the attributes and the
// spacing inside a style attribute do not matter (the DOM writes "text-align: center;" anyway)
const normalize = html => {
  const template = document.createElement('template');
  template.innerHTML = html.replace(/>\s*\n\s*</g, '><').trim();
  template.content.querySelectorAll('*').forEach(element => {
    const attributes = Array.from(element.attributes).map(({ name, value }) => [name, value]).sort();
    attributes.forEach(([name]) => element.removeAttribute(name));
    attributes.forEach(([name, value]) => element.setAttribute(name, value));
    if (element.hasAttribute('style')) element.setAttribute('style', element.style.cssText);
  });
  return template.innerHTML;
};

describe('rich text HTML', () => {
  describe.each(Object.entries(STORED))('%s', (name, stored) => {
    // shortcut: proves the fixtures are real draft-js output; remove together with draft-js
    it('is what the draft-js editor stores', () => {
      expect(draft(stored)).toBe(stored);
    });

    it('comes out of the new editor unchanged', () => {
      expect(normalize(tiptap(stored))).toBe(normalize(stored));
    });
  });

  it('keeps the single line format (line_break setting)', () => {
    const stored = formatLineBreak('<p>Hello <strong>you</strong></p>\n<p>second line</p>\n');
    expect(normalize(formatLineBreak(tiptap(stored)))).toBe(normalize(stored));
  });

  // The back-office editor (wysihtml5) allowed much more HTML. These are kept already...
  describe('from the back-office editor', () => {
    it.each([
      ['headings, lists and line breaks', '<h2>Title</h2><ul><li>one</li><li>two</li></ul><p>a<br>b</p>'],
      ['a link with a title',             '<p><a href="/about" title="About us" target="_blank">about</a></p>']
    ])('keeps %s', (_name, html) => {
      expect(normalize(tiptap(html))).toBe(normalize(html));
    });

    // ...and these are not yet: the list of what replacing wysihtml5 must add.
    // it.failing turns red once one of them works; then make it a normal it.
    it.failing.each([
      ['b / i / u / strike tags',      '<p><b>bold</b> <i>italic</i> <u>under</u> <strike>strike</strike></p>'],
      ['alignment classes',            '<p class="wysiwyg-text-align-center">centered</p>'],
      ['floating images',              '<p><img src="/samples/photo.jpg" alt="Photo" class="wysiwyg-float-left" width="200" height="100">text</p>'],
      ['tables',                       '<table><tbody><tr><th>h</th></tr><tr><td colspan="2">cell</td></tr></tbody></table>'],
      ['embeds (iframe)',              '<p><iframe src="https://www.youtube.com/embed/x" width="560" height="315" frameborder="0" allowfullscreen=""></iframe></p>'],
      ['divs with an id and a class',  '<div id="intro" class="lead"><p>text</p></div>'],
      ['color classes on spans',       '<p><span class="wysiwyg-color-red">red</span></p>']
    ])('does not keep %s yet', (_name, html) => {
      expect(normalize(tiptap(html))).toBe(normalize(html));
    });
  });
});
