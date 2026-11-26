# The rich text editor of the back-office (html fields of content entries, editable texts,
# site metafields): the toolbar, the stored HTML and the inline option. The editor-specific
# bits (where the text is typed, the toolbar buttons) live in the helpers below.
describe 'The rich text editor of the back-office', js: true do

  SELECT_ALL = [RUBY_PLATFORM.include?('darwin') ? :command : :control, 'a']

  # HTML as the editor writes it itself: saving it again without touching it keeps it as is
  WRITTEN = %{<h2 class="wysiwyg-text-align-center">Title</h2><p><b>b</b> <i>i</i> <u>u</u> <strike>s</strike> <strong>st</strong> <em>em</em></p><p><a target="_blank" href="/about" title="About">about</a></p><ul><li>one</li><li>two</li></ul><ol><li>first</li></ol><p><img class="wysiwyg-float-left" width="200" title="t" alt="a" src="/x.jpg" height="100">text</p><table class="striped"><thead><tr><th>h</th></tr></thead><tbody><tr><td colspan="2">c</td></tr></tbody></table><p><iframe width="560" height="315" src="https://www.youtube.com/embed/x" frameborder="0"></iframe></p><div id="intro" class="lead" data-x="1"><p class="my-own">text</p></div><p><span class="wysiwyg-color-red">red</span></p><blockquote>q</blockquote><pre>pre</pre>}

  before do
    create_full_site
    @content_type = @site.content_types.build(name: 'Notes', slug: 'notes').tap do |ct|
      ct.entries_custom_fields.build label: 'Title', name: 'title', type: 'string'
      ct.entries_custom_fields.build label: 'Body',  name: 'body',  type: 'text', text_formatting: 'html'
      ct.save!
    end
  end

  after { expect(page).to have_no_javascript_error }

  def open_entry(body)
    @entry = @content_type.entries.create!(title: 'Note', body: body)
    visit "/locomotive/#{@site.handle}/content_types/notes/entries/#{@entry._id}/edit"
    expect(page).to have_css('.wysihtml5-sandbox')
  end

  def save_entry
    within('#main') { click_button 'Save' }
    expect(page).to have_content(/successfully updated/i)
    @entry.reload.body
  end

  # the text being edited
  def in_editor(&block)
    within_frame(find('.wysihtml5-sandbox'), &block)
  end

  def type(*keys)
    in_editor { find('body').click; find('body').send_keys(*keys) }
  end

  def select_all
    in_editor { find('body').click; find('body').send_keys(SELECT_ALL) }
  end

  BUTTONS = {
    bold: 'formatInline', italic: 'italic', underline: 'underline', strike: 'strike',
    left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull',
    bullets: 'insertUnorderedList', numbers: 'insertOrderedList',
    link: 'createLink', unlink: 'removeLink', table: 'createTable'
  }

  def toolbar(name)
    find(".wysihtml5-toolbar a[data-wysihtml5-command='#{BUTTONS.fetch(name)}']").click
  end

  def block_type(name) # H1..H6, P, Code, Pre or the quote
    find('.wysihtml5-toolbar a.style').click
    within('.popover') { find("a[data-wysihtml5-command-value='#{name}']").click }
  end

  # wysihtml5 leaves empty paragraphs around a list or a table, and a <br> in an empty cell
  def without_empty_blocks(html)
    html.gsub(%r{<p></p>|<br>}, '')
  end

  # the drawer shows the list of assets before it listens to the clicks, then slides in:
  # wait until it is open and the button stands still
  def pick_asset(command, asset)
    expect(page).to have_no_css('.drawer.drawer-open')
    find(".wysihtml5-toolbar a[data-wysihtml5-command='#{command}']").click
    expect(page).to have_css('.drawer.drawer-open')
    button = find(".asset a.select[href='#{asset.source.url}']")
    position = -> { button.evaluate_script('JSON.stringify(this.getBoundingClientRect())') }
    Timeout.timeout(5) { loop { before = position.(); sleep 0.1; break if position.() == before } }
    button.click
  end

  def source_view
    find(".wysihtml5-toolbar a[data-wysihtml5-action='change_view']").click
  end

  it 'keeps the HTML it wrote itself when the field is not touched' do
    open_entry WRITTEN
    in_editor { expect(page).to have_css('table td[colspan="2"]') }
    expect(save_entry).to eq WRITTEN
  end

  it 'keeps text without paragraphs (lines separated by <br>)' do
    html = %{Loose text<br>second line<div class="lead">loose in div<p>para</p></div>}
    open_entry html
    expect(save_entry).to eq html
  end

  it 'removes scripts and event handlers' do
    open_entry %{<p onclick="x()">y</p><script>alert(1)</script><p style="color:red">styled</p>}
    expect(save_entry).to eq %{<p>y</p><p>styled</p>}
  end

  it 'makes text bold, italic, underlined and struck through' do
    open_entry '<p>Hello</p>'
    select_all
    %i(bold italic underline strike).each { |name| toolbar(name) }
    in_editor { expect(page).to have_css('strong', text: 'Hello') }

    body = save_entry
    %w(<strong> <i> <u> <strike>).each { |tag| expect(body).to include(tag) }
    expect(body).to include('Hello')
  end

  it 'aligns the text and changes the block type' do
    open_entry '<p>Hello</p>'
    select_all
    toolbar :center
    block_type 'h2'
    in_editor { expect(page).to have_css('h2', text: 'Hello') }

    expect(save_entry).to eq %{<h2 class="wysiwyg-text-align-center">Hello</h2>}
  end

  it 'makes a list' do
    open_entry '<p>Hello</p>'
    select_all
    toolbar :bullets
    type :end, :enter, 'world'
    in_editor { expect(page).to have_css('li', count: 2) }

    expect(without_empty_blocks(save_entry)).to eq %{<ul><li>Hello</li><li>world</li></ul>}
  end

  it 'links the text, with a target and a title' do
    open_entry '<p>Hello</p>'
    select_all
    toolbar :link
    within('.popover') do
      find('[name="rte_input_link_form[url]"]').set('https://example.com')
      find('[name="rte_input_link_form[target]"]').find('option[value="_blank"]').select_option
      find('[name="rte_input_link_form[title]"]').set('Example')
      find('.apply').click
    end
    in_editor { expect(page).to have_css('a', text: 'Hello') }

    expect(save_entry).to eq %{<p><a target="_blank" href="https://example.com" title="Example">Hello</a></p>}
  end

  it 'inserts a table' do
    open_entry '<p>Hello</p>'
    type :end
    toolbar :table
    within('.popover') do
      find('[name="rte_input_table_form[cols]"]').set('2')
      find('[name="rte_input_table_form[rows]"]').set('1')
      find('[name="rte_input_table_form[class_name]"]').set('striped')
      find('.apply').click
    end
    in_editor { expect(page).to have_css('table.striped td', count: 2) }

    expect(without_empty_blocks(save_entry)).to eq %{<p>Hello</p><table class="striped"><tbody><tr><td></td><td></td></tr></tbody></table>}
  end

  it 'inserts an image and a file from the assets' do
    image = create(:asset, site: @site)
    pdf   = create(:asset, site: @site, source: Rack::Test::UploadedFile.new(Rails.root.join('..', 'fixtures', 'assets', 'specs.pdf')))
    open_entry '<p>Hello</p>'
    type :end

    pick_asset 'insertImage', image
    in_editor { expect(page).to have_css("img[src='#{image.source.url}']") }

    type :end
    pick_asset 'insertFile', pdf
    in_editor { expect(page).to have_css("a[href='#{pdf.source.url}']") }

    body = save_entry
    expect(body).to include(%{src="#{image.source.url}"})
    expect(body).to include(%{href="#{pdf.source.url}"})
  end

  it 'edits the HTML source, cleaned like the rest' do
    open_entry '<p>Hello</p>'
    source_view
    find('.input.rte textarea').set(%{<p class="lead">Edited</p><script>alert(1)</script>})
    source_view
    in_editor { expect(page).to have_css('p.lead', text: 'Edited') }

    expect(save_entry).to eq %{<p class="lead">Edited</p>}
  end

  it 'counts the characters' do
    open_entry '<p>Hello <b>you</b></p>'
    expect(page).to have_css('.wysihtml5-counter', text: /\A9\z/)
    type :end, '!'
    expect(page).to have_css('.wysihtml5-counter', text: /\A10\z/)
    expect(save_entry).to eq '<p>Hello <b>you!</b></p>'
  end

  it 'keeps an inline editable text without paragraphs' do
    page_with_text = @site.pages.create!(parent: @site.pages.root.first, title: 'Inline', slug: 'inline',
      raw_template: %{<html><body><h1>{% editable_text title, format: 'html', inline: true %}Hello<br>world{% endeditable_text %}</h1></body></html>})
    visit "/locomotive/#{@site.handle}/pages/#{page_with_text._id}/editable_elements"
    expect(page).to have_css('.wysihtml5-sandbox')
    expect(page).to have_no_css(".wysihtml5-toolbar a[data-wysihtml5-command='justifyCenter']")
    expect(page).to have_no_css(".wysihtml5-toolbar a[data-wysihtml5-command='createTable']")

    type :end, '!'
    in_editor { expect(page).to have_text('world!') }
    click_button 'Save'
    expect(page).to have_content(/successfully updated|saved/i)

    expect(page_with_text.reload.editable_elements.first.content).to eq 'Hello<br>world!'
  end

end
