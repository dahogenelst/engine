# The blocks of a section displayed as a tree (blocks_display: 'tree'): dragging a block
# sideways changes its depth, dragging it up or down moves it together with its children.
# The rules themselves are unit tested in app/javascript/test/utils/block_tree.test.js.
describe 'Sorting the blocks of a section displayed as a tree', js: true do

  before do
    create_full_site
    create(:section, site: @site, name: 'Menu', slug: 'menu',
      template: %{<nav>{{ section.settings.title }}<ul class="menu">{% for block in section.blocks_as_tree %}<li>{{ block.settings.label }}{% if block.leaves.size > 0 %}<ul>{% for leaf in block.leaves %}<li>{{ leaf.settings.label }}</li>{% endfor %}</ul>{% endif %}</li>{% endfor %}</ul></nav>},
      definition: { name: 'Menu', blocks_display: 'tree', block_max_depth: 2,
        settings: [{ label: 'Title', id: 'title', type: 'text' }],
        blocks: [{ type: 'link', name: 'Link', settings: [{ label: 'Label', id: 'label', type: 'text' }] }] })
  end

  def create_menu(*links) # [label, depth]
    @menu = @site.pages.create!(
      parent: @site.pages.root.first, title: 'Menu page', slug: 'menu-page',
      raw_template: %{<html><head></head><body>{% section 'menu' %}</body></html>},
      sections_content: { menu: { settings: { title: 'Main menu' }, blocks: links.map { |label, depth|
        { type: 'link', depth: depth, settings: { label: label } }
      } } }
    )
    visit "/locomotive/#{@site.handle}/pages/#{@menu._id}/content/edit"
    expect(page).to have_content('/menu-page')
    expect(page).to have_no_css('.editor-startup') # its fade-out still covers the list
    find(:link, text: /\Amain menu\z/i).click
    expect(page).to have_css('.editor-list-item', count: links.size)
    expect(page).to have_no_css('.editor-transition[class*="-enter-active"]') # the view still slides in: the handles move
  end

  # drags the handle of a block with the mouse: down to the vertical center of `over` (+dy),
  # and dx sideways from where it started, which sets the depth (20px per level)
  def drag_block(label, over:, dx: 0, dy: 0)
    handle = find('.editor-list-item', text: /\A#{label}\z/i).find('.editor-list-item--drag-handle')
    target = find('.editor-list-item', text: /\A#{over}\z/i)
    center = ->(el) { r = el.native.rect; [r.x + r.width / 2, r.y + r.height / 2] }
    down   = (center.(target)[1] - center.(handle)[1] + dy).round
    page.driver.browser.action
      .click_and_hold(handle.native).move_by(0, 3).move_by(0, -3)
      .move_by(dx / 2, down / 2).move_by(dx - dx / 2, down - down / 2).pause(duration: 0.3)
      .release.perform
  end

  def expect_list(expected) # [label, depth] as the editor shows them (indented by 20px per level)
    page.document.synchronize do
      found = all('.editor-list-item').map do |item|
        [item.find('.editor-list-item--label').text, item.find(:xpath, '..').native.css_value('margin-left').to_i / 20]
      end
      raise Capybara::ExpectationNotMet, "expected #{expected}, got #{found}" unless found == expected
    end
  end

  def expect_preview(html)
    within_frame(find('iframe')) do
      page.document.synchronize do
        found = find('ul.menu')['innerHTML'].gsub(/ data-locomotive-[a-z-]+="[^"]*"/, '') # editor markers
        raise Capybara::ExpectationNotMet, "expected #{html}, got #{found}" unless found == html
      end
    end
  end

  def saved_blocks
    click_button 'Save'
    expect(page).to have_no_button('Saving...', wait: 10)
    Locomotive::Page.find(@menu._id).sections_content.dig('menu', 'blocks').map { |b| [b.dig('settings', 'label'), b['depth'].to_i] }
  end

  it 'indents a block under the previous one' do
    create_menu ['Home', 0], ['About', 0], ['Team', 0], ['Contact', 0]

    drag_block 'Team', over: 'Team', dx: 40

    expect_list [['HOME', 0], ['ABOUT', 0], ['TEAM', 1], ['CONTACT', 0]]
    expect_preview '<li>Home</li><li>About<ul><li>Team</li></ul></li><li>Contact</li>'
    expect(saved_blocks).to eq [['Home', 0], ['About', 0], ['Team', 1], ['Contact', 0]]
    expect(page).to have_no_javascript_error
  end

  it 'outdents a block' do
    create_menu ['Home', 0], ['About', 0], ['Team', 1], ['Contact', 0]

    drag_block 'Team', over: 'Team', dx: -40

    expect_list [['HOME', 0], ['ABOUT', 0], ['TEAM', 0], ['CONTACT', 0]]
    expect_preview '<li>Home</li><li>About</li><li>Team</li><li>Contact</li>'
    expect(saved_blocks).to eq [['Home', 0], ['About', 0], ['Team', 0], ['Contact', 0]]
  end

  it 'moves a block together with its children' do
    create_menu ['Home', 0], ['About', 0], ['Team', 1], ['Contact', 0]

    drag_block 'About', over: 'Contact', dy: 10 # the lower half of Contact: after it

    expect_list [['HOME', 0], ['CONTACT', 0], ['ABOUT', 0], ['TEAM', 1]]
    expect_preview '<li>Home</li><li>Contact</li><li>About<ul><li>Team</li></ul></li>'
    expect(saved_blocks).to eq [['Home', 0], ['Contact', 0], ['About', 0], ['Team', 1]]
  end

  it 'never indents deeper than the block_max_depth of the section' do
    create_menu ['Home', 0], ['About', 1], ['Team', 2], ['Contact', 1]

    drag_block 'Contact', over: 'Contact', dx: 120 # Team above would allow depth 3, block_max_depth is 2

    expect_list [['HOME', 0], ['ABOUT', 1], ['TEAM', 2], ['CONTACT', 2]]
    expect(saved_blocks).to eq [['Home', 0], ['About', 1], ['Team', 2], ['Contact', 2]]
  end

end
