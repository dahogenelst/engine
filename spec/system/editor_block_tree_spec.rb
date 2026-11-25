# The blocks of a section displayed as a tree (blocks_display: 'tree'): dragging a block
# sideways changes its depth, dragging it up or down moves it together with its children.
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
  end

  # react-dnd uses native HTML5 drag and drop, which WebDriver cannot drive with the mouse, so
  # fire the drag events ourselves. The pointer goes dx sideways from where the drag started
  # (sortly indents per 20px) and dy from the vertical center of `over`.
  def html5_drag(label, over:, dx: 0, dy: 0)
    handle = find('.editor-list-item', text: /\A#{label}\z/i).find('.editor-list-item--drag-handle')
    target = find('.editor-list-item', text: /\A#{over}\z/i).find(:xpath, '../..') # the drop target wraps the indented wrapper of the item
    page.evaluate_async_script(<<~JS, handle, target, dx, dy)
      const [handle, target, dx, dy, done] = arguments;
      const dataTransfer = new DataTransfer();
      const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
      const fire = (el, type, [x, y]) => el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer, clientX: x, clientY: y }));
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      (async () => {
        const start = center(handle);
        fire(handle, 'dragstart', start);
        await wait(50);
        const point = [start[0] + dx, center(target)[1] + dy];
        fire(target, 'dragenter', point);
        for (let i = 0; i < 10; i++) { fire(target, 'dragover', point); await wait(30); } // sortly re-checks every animation frame
        fire(target, 'drop', point);
        fire(handle, 'dragend', point);
        done();
      })();
    JS
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

    html5_drag 'Team', over: 'Team', dx: 40

    expect_list [['HOME', 0], ['ABOUT', 0], ['TEAM', 1], ['CONTACT', 0]]
    expect_preview '<li>Home</li><li>About<ul><li>Team</li></ul></li><li>Contact</li>'
    expect(saved_blocks).to eq [['Home', 0], ['About', 0], ['Team', 1], ['Contact', 0]]
    expect(page).to have_no_javascript_error
  end

  it 'outdents a block' do
    create_menu ['Home', 0], ['About', 0], ['Team', 1], ['Contact', 0]

    html5_drag 'Team', over: 'Team', dx: -40

    expect_list [['HOME', 0], ['ABOUT', 0], ['TEAM', 0], ['CONTACT', 0]]
    expect_preview '<li>Home</li><li>About</li><li>Team</li><li>Contact</li>'
    expect(saved_blocks).to eq [['Home', 0], ['About', 0], ['Team', 0], ['Contact', 0]]
  end

  it 'moves a block together with its children' do
    create_menu ['Home', 0], ['About', 0], ['Team', 1], ['Contact', 0]

    html5_drag 'About', over: 'Contact', dy: 10 # the lower half of Contact: after it

    expect_list [['HOME', 0], ['CONTACT', 0], ['ABOUT', 0], ['TEAM', 1]]
    expect_preview '<li>Home</li><li>Contact</li><li>About<ul><li>Team</li></ul></li>'
    expect(saved_blocks).to eq [['Home', 0], ['Contact', 0], ['About', 0], ['Team', 1]]
  end

  it 'never indents deeper than one level below the previous block' do
    create_menu ['Home', 0], ['About', 0], ['Team', 0]

    html5_drag 'Team', over: 'Team', dx: 120 # far enough for several levels

    expect_list [['HOME', 0], ['ABOUT', 0], ['TEAM', 1]]
    expect(saved_blocks).to eq [['Home', 0], ['About', 0], ['Team', 1]]
  end

end
