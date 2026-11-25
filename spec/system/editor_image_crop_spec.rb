# Cropping the image of an image_picker setting that is bigger than the size the section asks for.
describe 'Cropping an image setting of a section', js: true do

  before do
    create_full_site
    create(:section, site: @site, name: 'Banner', slug: 'banner',
      template: %{<div class="banner">{{ section.settings.title }}</div>},
      definition: { name: 'Banner', settings: [
        { label: 'Title', id: 'title', type: 'text' },
        { label: 'Picture', id: 'picture', type: 'image_picker', width: 100, height: 75 }
      ], blocks: [] })
    # ocean.jpg is served by the dummy app; uploaded assets are not in tests
    @banner = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Banner page', slug: 'banner-page',
      raw_template: %{<html><head></head><body>{% section 'banner' %}</body></html>},
      sections_content: { banner: { settings: { title: 'Welcome', picture: { source: '/images/ocean.jpg', width: 516, height: 400 } } } }
    )
  end

  it 'crops the image and saves the cropped version' do
    visit "/locomotive/#{@site.handle}/pages/#{@banner._id}/content/edit"
    expect(page).to have_content('/banner-page')
    find(:link, text: /\Awelcome\z/i).click

    click_button 'Crop'
    expect(page).to have_content('Crop image')
    expect(page).to have_css('.ReactCrop img')
    click_button 'Apply'
    expect(page).to have_no_content('Crop image', wait: 10)

    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)

    picture = Locomotive::Page.find(@banner._id).sections_content.dig('banner', 'settings', 'picture')
    expect(picture['cropped']).to be_present
    expect(page).to have_no_javascript_error
  end

end
