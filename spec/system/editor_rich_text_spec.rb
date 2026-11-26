# The rich text setting of a section: the toolbar, the stored HTML and the setting options
# (line_break, nb_rows). The selectors only rely on the toolbar titles and the contenteditable,
# so the specs stay the same when the editor behind it changes.
describe 'Editing a rich text setting of a section', js: true do

  SELECT_ALL = [RUBY_PLATFORM.include?('darwin') ? :command : :control, 'a']

  def open_intro(body: '<p>Hello</p>', **setting)
    create(:section, site: @site, name: 'Intro', slug: 'intro',
      template: %{<div class="intro">{{ section.settings.body }}</div>},
      definition: { name: 'intro', blocks: [],
        settings: [{ label: 'Body', id: 'body', type: 'text', html: true, default: 'Hello' }.merge(setting)] })
    @intro = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Intro page', slug: 'intro-page',
      raw_template: %{<html><head></head><body>{% section 'intro' %}</body></html>},
      sections_content: { intro: { settings: { body: body } } }
    )
    visit "/locomotive/#{@site.handle}/pages/#{@intro._id}/content/edit"
    expect(page).to have_no_css('.editor-startup', wait: 15)
    find('.editor-list-item--label a', match: :first).click
    expect(page).to have_css('.editor-input-rich-text [contenteditable="true"]')
  end

  def editor
    find('.editor-input-rich-text [contenteditable="true"]')
  end

  def select_all
    editor.click
    editor.send_keys(SELECT_ALL)
  end

  def toolbar(title)
    find(".editor-input-rich-text [title='#{title}']").click
  end

  def block_type(name)
    find('.editor-input-rich-text [title="Block Type"]').click
    find('.rdw-dropdownoption-default', text: name, exact_text: true).click
  end

  def saved_body
    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)
    Locomotive::Page.find(@intro._id).sections_content.dig('intro', 'settings', 'body')
  end

  before { create_full_site }

  after { expect(page).to have_no_javascript_error }

  it 'makes text bold, italic, underlined and struck through' do
    open_intro
    select_all
    %w(Bold Italic Underline Strikethrough).each { |title| toolbar(title) }
    editor.send_keys(:end, ' world')
    expect(editor).to have_text('Hello world')

    body = saved_body
    expect(body).to include('Hello world')
    %w(<strong> <em> <ins> <del>).each { |tag| expect(body).to include(tag) }
  end

  it 'aligns the text and changes the block type' do
    open_intro
    select_all
    toolbar 'Center'
    block_type 'H2'
    expect(editor).to have_css('h2', text: 'Hello')

    expect(saved_body).to eq %{<h2 style="text-align:center;">Hello</h2>\n}
  end

  it 'makes a list' do
    open_intro
    select_all
    toolbar 'Unordered'
    editor.send_keys(:end, :enter, 'world')
    expect(editor).to have_css('li', count: 2)

    expect(saved_body).to eq %{<ul>\n<li>Hello</li>\n<li>world</li>\n</ul>\n}
  end

  it 'links the text to a page, opened in a new window' do
    open_intro
    select_all
    toolbar 'Link'
    within('.modal-window.modal-open') do
      choose 'Page'
      find('.url-picker-page-settings input[type="text"]').send_keys('Cont')
      find('.react-autosuggest__suggestion', text: 'Contact').click
      find('.url-picker-page-settings .rc-switch').click
      click_button 'Done'
    end
    expect(editor).to have_css('a', text: 'Hello')

    body     = saved_body
    contact  = @site.pages.where(slug: 'contact').first
    resource = body[%r{/_locomotive-link/([^"]+)"}, 1]
    # draft-js puts a space after an inserted link
    expect(body).to match(%r{\A<p><a href="http://[^"]+/locomotive/#{@site.handle}/preview/_locomotive-link/[^"]+" target="_blank">Hello</a>(&nbsp;)?</p>\n\z})
    expect(JSON.parse(Base64.decode64(resource))).to include('type' => 'page', 'value' => contact._id.to_s, 'new_window' => true)
  end

  it 'opens the stored HTML and keeps it, the label puts the cursor at the end' do
    stored = %{<h2 style="text-align:center;">Title</h2>\n<p><strong>bold</strong> <ins>under</ins> and <a href="https://example.com" target="_self">a link</a></p>\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>\n<p>Last</p>\n}
    open_intro body: stored
    expect(editor).to have_css('h2', text: 'Title')
    expect(editor).to have_css('li', count: 2)

    find('.editor-input-rich-text label', text: /\Abody\z/i).click
    editor.send_keys('!')
    expect(editor).to have_text('Last!')

    expect(saved_body).to eq stored.sub('Last', 'Last!')
  end

  it 'keeps a single line with the line_break option' do
    open_intro line_break: true
    expect(page).to have_css('.editor-input-rich-text [title="Bold"]')
    expect(page).to have_no_css('.editor-input-rich-text [title="Center"]')
    expect(page).to have_no_css('.editor-input-rich-text [title="Unordered"]')
    expect(page).to have_no_css('.editor-input-rich-text [title="Block Type"]')

    editor.click
    editor.send_keys(SELECT_ALL, :end, :enter, 'world')
    expect(editor).to have_text('world')

    expect(saved_body).to eq "Hello<br>world\n"
  end

  it 'counts the characters and sizes the editor to the nb_rows option' do
    open_intro body: '<p>Hello <strong>you</strong></p>', nb_rows: 4
    expect(page).to have_css('.editor-input-rich-text-counter', text: /\A9\z/)
    expect(editor.evaluate_script('this.getBoundingClientRect().height')).to be_within(1).of(80) # 4 rows of 20px (minus a border)

    select_all
    editor.send_keys(:end, '!')
    expect(page).to have_css('.editor-input-rich-text-counter', text: /\A10\z/)
  end

end
