import { generateJSON, generateHTML } from '@tiptap/html';

import { extensions, toStoredHtml } from '../../../javascript/src/locomotive/editor/rich_text/extensions';
import { formatLineBreak } from '../../../javascript/src/locomotive/editor/utils/misc';

// HTML exactly as the section editor (draft-js) stored it (a no-break space is always written
// as &nbsp; now, draft-js sometimes wrote the character). Opening it in the new editor and
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
  entities:         '<p>café &lt;tag&gt; a&nbsp;b "quote"</p>\n',
  empty:            '<p></p>\n'
};

const tiptap = html => toStoredHtml(generateHTML(generateJSON(html, extensions), extensions));

describe('rich text HTML', () => {
  it.each(Object.entries(STORED))('keeps %s unchanged', (_name, stored) => {
    expect(tiptap(stored)).toBe(stored);
  });

  it('keeps the single line format (line_break setting)', () => {
    const stored = formatLineBreak('<p>Hello <strong>you</strong></p>\n<p>second line</p>\n');
    expect(formatLineBreak(tiptap(stored))).toBe(stored);
  });
});
