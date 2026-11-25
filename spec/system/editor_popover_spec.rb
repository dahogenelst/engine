# The popovers of the editor (react-awesome-popover): picking the type of a new block and switching the locale.
describe 'Using the popovers of the editor', js: true do

  before do
    create_full_site
    @site.update!(locales: %w(en fr))
    create(:section, site: @site, name: 'Story', slug: 'story',
      template: %{<div class="story">{{ section.settings.title }}{% for block in section.blocks %}<p class="{{ block.type }}">{{ block.settings.text }}</p>{% endfor %}</div>},
      definition: { name: 'Story', settings: [{ label: 'Title', id: 'title', type: 'text' }], blocks: [
        { type: 'paragraph', name: 'Paragraph', settings: [{ label: 'Text', id: 'text', type: 'text' }] },
        { type: 'quote', name: 'Quote', settings: [{ label: 'Text', id: 'text', type: 'text' }] }
      ] })
    @story = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Story page', slug: 'story-page',
      raw_template: %{<html><head></head><body>{% section 'story' %}</body></html>},
      sections_content: { story: { settings: { title: 'Once upon a time' }, blocks: [] } }
    )
    ::Mongoid::Fields::I18n.with_locale(:fr) do
      @story.update!(title: 'Histoire', slug: 'histoire', sections_content: { story: { settings: { title: 'Il était une fois' }, blocks: [] } })
    end
    visit "/locomotive/#{@site.handle}/pages/#{@story._id}/content/edit"
    expect(page).to have_content('/story-page')
    expect(page).to have_no_css('.editor-startup') # its fade-out still covers the action bar
  end

  it 'adds a block of the type picked in the popover' do
    find(:link, text: /\Aonce upon a time\z/i).click
    expect(page).to have_no_button('Quote')

    click_button '+ add'
    click_button 'Quote'
    expect(page).to have_no_button('Paragraph') # the popover closes
    expect(page).to have_css('.editor-list-item', text: /\Aquote #1\z/i) # a new block without text is named after its type

    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)
    blocks = Locomotive::Page.find(@story._id).sections_content.dig('story', 'blocks')
    expect(blocks.map { |block| block['type'] }).to eq ['quote']
    expect(page).to have_no_javascript_error
  end

  it 'closes the block popover when clicking outside' do
    find(:link, text: /\Aonce upon a time\z/i).click
    click_button '+ add'
    expect(page).to have_button('Paragraph')

    find('.editor-view--header-title').click
    expect(page).to have_no_button('Paragraph')
  end

  it 'switches the content to another locale' do
    find('.locale-switcher-button').click
    find('.locale-switcher-locale a', text: /fr version/i).click

    expect(page).to have_css('.locale-switcher-button', text: /\Afr/i)
    expect(page).to have_link(text: /\Ail était une fois\z/i)
    within_frame(find('iframe')) { expect(page).to have_css('.story', text: 'Il était une fois') }
    expect(page).to have_no_javascript_error
  end

end
