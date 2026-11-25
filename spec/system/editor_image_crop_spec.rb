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

  def open_cropper
    visit "/locomotive/#{@site.handle}/pages/#{@banner._id}/content/edit"
    expect(page).to have_content('/banner-page')
    find(:link, text: /\Awelcome\z/i).click
    click_button 'Crop'
    expect(page).to have_content('Crop image')
    expect(page).to have_css('.ReactCrop img')
    expect(page).to have_css('.ReactCrop__crop-selection')
  end

  # drags with the mouse: press, a few small moves, release
  def drag_by(element, dx, dy)
    page.driver.browser.action.click_and_hold(element.native)
      .move_by(2, 2).move_by(dx / 2 - 2, dy / 2 - 2).move_by(dx - dx / 2, dy - dy / 2)
      .release.perform
  end

  # the ImageMagick instructions the editor sent to the server for the cropped thumbnail
  def apply_and_read_format
    click_button 'Apply'
    expect(page).to have_no_content('Crop image', wait: 10)
    url = evaluate_script("performance.getEntriesByType('resource').map(e => e.name).filter(n => n.includes('format=')).pop()")
    URI.decode_www_form(URI(url).query).to_h['format']
  end

  def saved_picture
    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)
    Locomotive::Page.find(@banner._id).sections_content.dig('banner', 'settings', 'picture')
  end

  it 'crops with the default selection and saves the cropped version' do
    open_cropper
    expect(apply_and_read_format).to eq '516x400|100x75+0+0' # resize|crop size+offset, for ImageMagick
    expect(saved_picture['cropped']).to be_present
    expect(page).to have_no_javascript_error
  end

  it 'never shrinks the selection below the size the section asks for' do
    open_cropper
    drag_by find('.ReactCrop__drag-handle.ord-se'), -40, -30
    expect(apply_and_read_format).to eq '516x400|100x75+0+0'
  end

  it 'starts from the crop saved before (by the old cropper too)' do
    width = 100.0 / 516 * 100 # the crop is stored in % of the image, with its aspect
    settings = @banner.sections_content['banner']['settings']
    settings['picture'] = settings['picture'].merge('crop' => { 'x' => 10, 'y' => 10, 'width' => width, 'height' => width / (100.0 / 75), 'aspect' => 100.0 / 75 })
    @banner.update!(sections_content: @banner.sections_content)

    open_cropper
    expect(apply_and_read_format).to eq '516x400|100x75+52+40'
  end

  it 'crops a moved selection' do
    open_cropper
    drag_by find('.ReactCrop__crop-selection'), 60, 40
    expect(apply_and_read_format).to eq '516x400|100x75+60+40'
    expect(saved_picture['crop']).to include('x' => be > 0, 'y' => be > 0)
  end

  it 'crops an enlarged selection (zoomed out)' do
    open_cropper
    drag_by find('.ReactCrop__drag-handle.ord-se'), 80, 60
    expect(apply_and_read_format).to eq '287x222|100x75+0+0' # a bigger selection shrinks the image before cropping
    expect(saved_picture['cropped']).to be_present
  end

end
