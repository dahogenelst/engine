# The integer setting of a section with min/max is a slider (rc-slider).
describe 'Editing an integer setting with a slider', js: true do

  before do
    create_full_site
    create(:section, site: @site, name: 'Spacer', slug: 'spacer',
      template: %{<div class="spacer" style="height: {{ section.settings.size }}px">{{ section.settings.title }}</div>},
      definition: { name: 'Spacer', settings: [
        { label: 'Title', id: 'title', type: 'text' },
        { label: 'Size', id: 'size', type: 'integer', min: 0, max: 100, step: 5, unit: 'px' }
      ], blocks: [] })
    @spacer = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Spacer page', slug: 'spacer-page',
      raw_template: %{<html><head></head><body>{% section 'spacer' %}</body></html>},
      sections_content: { spacer: { settings: { title: 'Gap' } } }
    )
  end

  it 'changes the value with the keyboard and saves it' do
    visit "/locomotive/#{@site.handle}/pages/#{@spacer._id}/content/edit"
    expect(page).to have_content('/spacer-page')
    find(:link, text: /\Agap\z/i).click

    find('.rc-slider-handle').send_keys(:right, :right, :right)
    expect(page).to have_css('.editor-input--label--value', text: '15px')

    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)

    size = Locomotive::Page.find(@spacer._id).sections_content.dig('spacer', 'settings', 'size')
    expect(size).to eq 15
    expect(page).to have_no_javascript_error
  end

end
