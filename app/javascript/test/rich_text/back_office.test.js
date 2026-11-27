import { Editor } from '@tiptap/core';
import { roundtrip, keepsHtml, extensions, toEditorHtml, toStoredHtml, sanitize } from '../../../javascript/src/locomotive/editor/rich_text/back_office';

// HTML as the back-office editor (wysihtml5) stored it: opened in the new editor and saved again,
// it must come back byte for byte (the same fixture as spec/system/back_office_rich_text_spec.rb).
const WRITTEN = '<h2 class="wysiwyg-text-align-center">Title</h2><p><b>b</b> <i>i</i> <u>u</u> <strike>s</strike> <strong>st</strong> <em>em</em></p><p><a target="_blank" href="/about" title="About">about</a></p><ul><li>one</li><li>two</li></ul><ol><li>first</li></ol><p><img class="wysiwyg-float-left" width="200" title="t" alt="a" src="/x.jpg" height="100">text</p><table class="striped"><thead><tr><th>h</th></tr></thead><tbody><tr><td colspan="2">c</td></tr></tbody></table><p><iframe width="560" height="315" src="https://www.youtube.com/embed/x" frameborder="0"></iframe></p><div id="intro" class="lead" data-x="1"><p class="my-own">text</p></div><p><span class="wysiwyg-color-red">red</span></p><blockquote>q</blockquote><pre>pre</pre>';

describe('back-office rich text HTML', () => {

  it('keeps the HTML wysihtml5 wrote, byte for byte', () => {
    expect(roundtrip(WRITTEN)).toBe(WRITTEN);
  });

  it.each([
    ['b / i / u / strike tags',      '<p><b>bold</b> <i>italic</i> <u>under</u> <strike>strike</strike></p>'],
    ['strong / em',                  '<p><strong>bold</strong> <em>italic</em></p>'],
    ['alignment classes',            '<p class="wysiwyg-text-align-center">centered</p><h3 class="lead wysiwyg-text-align-right">right</h3>'],
    ['floating images',              '<p><img class="wysiwyg-float-right" alt="Photo" src="/samples/photo.jpg">text</p>'],
    ['a table with sections',        '<table class="t"><thead><tr><th>h</th><th>h2</th></tr></thead><tbody><tr><td rowspan="2">a</td><td>b</td></tr><tr><td class="x">c</td></tr></tbody><tfoot><tr><td colspan="2">f</td></tr></tfoot></table>'],
    ['empty table cells',            '<table><tbody><tr><td><br></td><td><br></td></tr></tbody></table>'],
    ['embeds (iframe)',              '<p><iframe width="560" height="315" src="https://www.youtube.com/embed/x" frameborder="0" allowfullscreen=""></iframe></p>'],
    ['divs with an id, a class and data', '<div id="intro" class="lead" data-x="1" data-y="2"><p>text</p><div class="inner"><h3>t</h3></div></div>'],
    ['spans with a class',           '<p><span class="wysiwyg-color-red">red</span> and <span id="n" data-x="1">data</span></p>'],
    ['links with a class and data',  '<p><a id="l" target="_self" href="/x" title="X" class="btn" data-track="1" rel="nofollow">x</a></p>'],
    ['quotes with a cite',           '<blockquote cite="https://example.com">q</blockquote>'],
    ['lists with classes',           '<ul class="checks"><li id="a" class="done">one</li><li>two</li></ul>'],
    ['line breaks and empty paragraphs', '<p></p><ul><li>a</li></ul><p>a<br>b</p><p></p>'],
    ['entities',                     '<p>café &lt;tag&gt; a&nbsp;b "quote" &amp;</p>'],
    ['text outside a paragraph',     'Loose text<br>second line<h2>Title</h2>more <b>text</b>'],
    ['loose text in a div',          '<div class="lead">loose<p>para</p></div>'],
    ['an empty div (filled by a script)', '<div class="pipedriveWebForms" data-pd-webforms="https://example.com/form"></div><p>after</p>'],
    ['spans in spans (Word)',        '<p><span class="TextRun" data-x="1"><span class="NormalTextRun">word</span></span></p>']
  ])('keeps %s', (_name, html) => {
    expect(roundtrip(html)).toBe(html);
    expect(keepsHtml(html)).toBe(true);
  });

  it('keeps an inline text without a paragraph (editable texts on one line)', () => {
    expect(roundtrip('Hello <b>you</b><br>second line', { inline: true })).toBe('Hello <b>you</b><br>second line');
  });

  // These would change: the editor opens them as HTML source (and tells why).
  it.each([
    ['a block inside a link',        '<a href="/x"><p>block</p></a>'],
    ['an empty icon',                '<p><i class="fa fa-star"></i> star</p>'],
    ['a video',                      '<video></video>'],
    ['a form',                       '<form><input><button>Go</button></form>'],
    ['a javascript link',            '<p><a href="javascript:alert(1)">js</a></p>'],
    ['formatting in a pre',          '<pre><b>bold</b> code</pre>']
  ])('detects %s', (_name, html) => {
    expect(keepsHtml(html)).toBe(false);
  });

  it('does not mind the order of the attributes or the spaces between blocks', () => {
    expect(keepsHtml('<p><a href="/x" target="_blank">x</a></p>\n<p><img src="/a.png" alt="a"></p>\n')).toBe(true);
  });

  it('does not mind spaces a browser does not show either', () => {
    expect(keepsHtml('<p>two  spaces and a\nnew line </p><p>\n\t</p>')).toBe(true);
    expect(keepsHtml('<pre>two  spaces</pre>')).toBe(true);
    expect(keepsHtml('<p>a&nbsp;&nbsp;b</p>')).toBe(true);
    expect(keepsHtml('<p><strong>question? </strong></p><p>a <b>b <br></b>c</p>')).toBe(true); // at the edges
  });

  it('does not mind formatting that shows the same', () => {
    expect(keepsHtml('<p><i></i>a<em></em> <i><i>b</i></i> <strong>c</strong><strong>d</strong></p>')).toBe(true);
    expect(keepsHtml('<p><span class="a">x</span><span class="a">y</span> <span class="b"><a href="/x">z</a></span></p>')).toBe(true);
    expect(keepsHtml('<p><i class="fa fa-star"></i> star</p>')).toBe(false); // an icon shows
  });

  it('keeps the lines of text outside a paragraph split with Enter', () => {
    const editor = new Editor({ extensions, content: toEditorHtml('ab<h2>t</h2>') });
    editor.chain().setTextSelection(2).splitBlock().run(); // in the middle: both parts stay outside
    expect(toStoredHtml(editor.getHTML())).toBe('a<br>b<h2>t</h2>');
    editor.chain().setTextSelection(5).splitBlock().insertContent('c').run(); // at the end: a new paragraph
    expect(toStoredHtml(editor.getHTML())).toBe('a<br>b<p>c</p><h2>t</h2>');
    editor.destroy();
  });

  it('keeps an empty text', () => {
    expect(keepsHtml('')).toBe(true);
  });

  it('removes from the source what runs a script, and nothing else', () => {
    const html = '<p class="x" style="color:red" data-y="1">a<br/>b <a href="/about">c</a></p>';
    expect(sanitize(html)).toBe(html);
    expect(sanitize('<p onclick="x()" class="a">y</p><script>alert(1)</script><a href=" jav\tascript:alert(1)" title="t">z</a><img src="javascript:x" alt="i">'))
      .toBe('<p class="a">y</p><a title="t">z</a><img alt="i">');
  });

  it('drops a list without items, it shows nothing', () => {
    expect(keepsHtml('<p>a</p><ul></ul><h2>t</h2>')).toBe(true);
    expect(roundtrip('<p>a</p><ul> </ul><h2>t</h2>')).toBe('<p>a</p><h2>t</h2>');
  });

});
