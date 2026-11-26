# Moving between the views of the editor (react-router): sections, blocks, pickers,
# the back buttons, the browser history, direct links and clicks in the preview.
describe 'Navigating in the editor', js: true do

  before do
    create_full_site
    @hello  = @site.pages.where(slug: 'hello-world').first
    @editor = "/locomotive/#{@site.handle}/pages/#{@hello._id}/content/edit"
  end

  def open_editor(path = '')
    visit @editor + path
    expect(page).to have_no_css('.editor-startup', wait: 15)
  end

  def expect_view(path, title)
    expect(page).to have_current_path(/\A#{Regexp.escape(@editor)}#{path}\z/)
    if title
      expect(page).to have_css('.editor-view--header-main-title', text: title, exact_text: true)
    else
      expect(page).to have_link(text: /\Agallery\z/i) # the list of sections
    end
  end

  def back
    find('.editor-view--header-back-btn a').click
  end

  SECTION = '/sections/\h+/edit'
  BLOCK   = '/sections/\h+/blocks/image/0/edit'
  PICKER  = '/sections/\h+/blocks/image/0/setting/image_picker/picture/images'

  it 'opens a section, a block and the image picker, and goes back with the back buttons' do
    open_editor
    find(:link, text: /\Agallery\z/i).click
    expect_view SECTION, 'gallery'
    first('.editor-list-item--label a').click
    expect_view BLOCK, 'Image'
    click_button 'Select'
    expect_view PICKER, 'Images'

    back
    expect_view BLOCK, 'Image'
    back
    expect_view SECTION, 'gallery'
    back
    expect_view '', nil
    expect(page).to have_no_javascript_error
  end

  it 'goes back with the browser history' do
    open_editor
    find(:link, text: /\Agallery\z/i).click
    expect_view SECTION, 'gallery' # the list of sections is gone: its links are not clicked by mistake
    first('.editor-list-item--label a').click
    expect_view BLOCK, 'Image'

    page.go_back
    expect_view SECTION, 'gallery'
    page.go_back
    expect_view '', nil
    page.go_forward
    expect_view SECTION, 'gallery'
  end

  it 'opens a section from a direct link' do
    open_editor
    find(:link, text: /\Athis is the header\z/i).click
    expect_view SECTION, 'This is the header'

    visit current_url
    expect(page).to have_no_css('.editor-startup', wait: 15)
    expect_view SECTION, 'This is the header'
  end

  it 'sends an unknown path back to the main view' do
    open_editor '/whatever/unknown'
    expect_view '', nil
  end

  it 'opens the section of a text clicked in the preview' do
    create(:section, site: @site, name: 'Card', slug: 'card',
      template: %{<div class="card">{{ section.settings.title }}</div>},
      definition: { name: 'Card', settings: [{ label: 'Title', id: 'title', type: 'text' }], blocks: [] })
    card = @site.pages.create!(parent: @site.pages.root.first, title: 'Card page', slug: 'card-page',
      raw_template: %{<html><head></head><body>{% section 'card' %}</body></html>},
      sections_content: { card: { settings: { title: 'Click me' } } })
    @editor = "/locomotive/#{@site.handle}/pages/#{card._id}/content/edit"
    open_editor

    within_frame(find('iframe')) { find('[data-locomotive-editor-setting]', text: 'Click me').click }
    expect_view SECTION, 'Click me'
    expect(page).to have_field(with: 'Click me')
  end

end
