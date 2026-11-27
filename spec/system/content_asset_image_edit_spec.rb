# Editing an image of the content assets in the browser (drawer): resizing, then saving
describe 'Editing an image of the content assets', js: true do

  # the browser loads the image itself: store the uploads where the app serves them
  # (on the uploader itself: other specs may have set its root)
  before { allow(Locomotive::ContentAssetUploader).to receive(:root).and_return(Rails.public_path.to_s) }
  after  { %w(sites spec).each { |dir| FileUtils.rm_rf(Rails.public_path.join(dir)) } } # uploads and their cache

  before do
    create_full_site
    @asset = create(:asset, site: @site, source: Rack::Test::UploadedFile.new(Rails.root.join('..', 'fixtures', 'images', 'logo1.jpg')))
  end

  after { expect(page).to have_no_javascript_error }

  it 'resizes the image and saves it as a new asset' do
    expect([@asset.width, @asset.height]).to eq [259, 194]
    visit "/locomotive/#{@site.handle}/content_assets"
    find("a.edit[href*='#{@asset._id}']").click
    find('.drawer .resize-btn').click

    within('.popover') do
      find('input[name="image_resize_form[width]"]').set('100').send_keys(:up) # keyup computes the height
      expect(page).to have_field('image_resize_form[height]', with: '75')
      find('.apply-resizing-btn').click
    end
    expect(page).to have_no_css('.popover')

    count = @site.content_assets.count
    find('.drawer .apply-btn').click
    expect(page).to have_no_css('.drawer.drawer-open')
    Timeout.timeout(5) { sleep 0.1 until @site.content_assets.count > count }

    resized = @site.content_assets.order_by(created_at: :desc).first
    expect([resized.width, resized.height]).to eq [100, 75]
  end

end
