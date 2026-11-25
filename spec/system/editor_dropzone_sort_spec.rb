# Reordering the sections of a dropzone by dragging their handle.
describe 'Sorting the sections of a dropzone', js: true do

  before do
    create_full_site
    create(:section, site: @site, name: 'Card', slug: 'card',
      template: %{<div class="card">{{ section.settings.title }}</div>},
      definition: { name: 'Card', settings: [{ label: 'Title', id: 'title', type: 'text' }], blocks: [] })
    @cards = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Cards', slug: 'cards',
      raw_template: %{<html><head></head><body>{% sections_dropzone %}</body></html>},
      sections_dropzone_content: %w(A B C).map { |title| { type: 'card', settings: { title: "Card #{title}" }, blocks: [] } }
    )
  end

  # a press, a few small moves, then the drop: sortable libraries only start dragging after the pointer moved
  def drag(source, target)
    page.driver.browser.action
      .click_and_hold(source.native).move_by(0, -2).move_by(0, -8)
      .move_to(target.native).move_by(0, -5).pause(duration: 0.3)
      .release.perform
  end

  def expect_texts(selector, texts)
    page.document.synchronize do
      found = all(selector).map(&:text)
      raise Capybara::ExpectationNotMet, "expected #{texts}, got #{found}" unless found == texts
    end
  end

  it 'moves a section and saves the new order' do
    visit "/locomotive/#{@site.handle}/pages/#{@cards._id}/content/edit"
    expect(page).to have_content('/cards')
    expect(page).to have_no_css('.editor-startup') # its fade-out still covers the list

    handles = all('.editor-dropzone-section .editor-list-item--drag-handle', count: 3)
    drag(handles[2], handles[0])
    expect_texts('.editor-dropzone-section .editor-list-item--label', ['CARD C', 'CARD A', 'CARD B'])

    within_frame(find('iframe')) do # the preview follows
      expect_texts('.card', ['Card C', 'Card A', 'Card B'])
    end

    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)

    titles = Locomotive::Page.find(@cards._id).sections_dropzone_content.map { |s| s.dig('settings', 'title') }
    expect(titles).to eq ['Card C', 'Card A', 'Card B']
    expect(page).to have_no_javascript_error
  end

end
