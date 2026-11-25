# The on/off switches of the editor (rc-switch): a checkbox setting and "open in a new window" of an external URL.
describe 'Editing a setting with a switch', js: true do

  before do
    create_full_site
    create(:section, site: @site, name: 'Promo', slug: 'promo',
      template: %{<div class="promo">{{ section.settings.title }}</div>},
      definition: { name: 'Promo', settings: [
        { label: 'Title', id: 'title', type: 'text' },
        { label: 'Highlighted', id: 'highlighted', type: 'checkbox' },
        { label: 'Link', id: 'link', type: 'url' }
      ], blocks: [] })
    @promo = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Promo page', slug: 'promo-page',
      raw_template: %{<html><head></head><body>{% section 'promo' %}</body></html>},
      sections_content: { promo: { settings: { title: 'Sale' } } }
    )
    visit "/locomotive/#{@site.handle}/pages/#{@promo._id}/content/edit"
    expect(page).to have_content('/promo-page')
    find(:link, text: /\Asale\z/i).click
  end

  def save_and_reload_settings
    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)
    Locomotive::Page.find(@promo._id).sections_content.dig('promo', 'settings')
  end

  it 'turns a checkbox setting on and off' do
    switch = find('.editor-input-checkbox .rc-switch')
    expect(switch[:class]).not_to include('rc-switch-checked')

    switch.click
    expect(page).to have_css('.editor-input-checkbox .rc-switch.rc-switch-checked')
    expect(save_and_reload_settings['highlighted']).to eq true

    find('.editor-input-checkbox .rc-switch').click
    expect(page).to have_no_css('.editor-input-checkbox .rc-switch.rc-switch-checked')
    expect(save_and_reload_settings['highlighted']).to eq false
    expect(page).to have_no_javascript_error
  end

  it 'opens an external URL in a new window' do
    within('.editor-input-url') { click_button 'Select' }
    expect(page).to have_content('Pick a target')

    choose 'URL'
    find('.url-picker-external-settings input[type="text"]').fill_in(with: 'https://www.example.com')
    find('.url-picker-external-settings .rc-switch').click
    expect(page).to have_css('.url-picker-external-settings .rc-switch.rc-switch-checked')

    link = save_and_reload_settings['link']
    expect(link).to include('type' => '_external', 'value' => 'https://www.example.com', 'new_window' => true)
    expect(page).to have_no_javascript_error
  end

end
