# Live editing: the page shown in the iframe and its editable elements next to it
describe 'Live editing', js: true do

  before do
    create_full_site
    root   = @site.pages.root.first
    @about = @site.pages.create!(parent: root, title: 'About', slug: 'about',
      raw_template: %{<html><head></head><body><h1>{% editable_text title %}About us{% endeditable_text %}</h1></body></html>})
    root.update!(raw_template: %{<html><head></head><body><a href="/about">About</a>{% editable_text intro %}Hello{% endeditable_text %}</body></html>})
  end

  after { expect(page).to have_no_javascript_error }

  it 'follows a link in the preview: the address and the form are those of the new page' do
    visit "/locomotive/#{@site.handle}/pages/#{@site.pages.root.first._id}/editable_elements"
    within_frame(find('.preview iframe, iframe.embed-responsive-item')) { click_link 'About' }

    expect(page).to have_current_path("/locomotive/#{@site.handle}/pages/#{@about._id}/editable_elements", ignore_query: true)
    expect(page).to have_css("form textarea", text: 'About us', visible: :all)
  end

end
