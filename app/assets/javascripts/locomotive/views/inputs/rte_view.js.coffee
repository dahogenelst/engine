Locomotive.Views.Inputs ||= {}

# The rich text input: the editor itself (Tiptap) is in the rich_text bundle (LocomotiveRichText)
class Locomotive.Views.Inputs.RteView extends Backbone.View

  events:
    'click .rte-toolbar a[data-command]': 'run_command'
    'click .rte-toolbar a.style':         'open_dialog'
    'click .rte-toolbar a.edit-table':    'open_dialog'
    'click .rte-toolbar a.source':        'toggle_source'
    'click .rte-toolbar a.expand':        'expand'
    'dblclick .rte-content':  'edit_link'
    'change textarea':        'on_content_change' # after the source is cleaned (rich_text)
    'highlight textarea':     'highlight'

  initialize: ->
    _.bindAll(@, 'on_content_change', 'on_selection', 'resize')

    @tokens = [
      PubSub.subscribe 'application_view.resize', @resize
    ]

    $textarea = @$('textarea')

    @rte = LocomotiveRichText.create $textarea[0],
      inline:       $textarea.data('inline')
      onChange:     @on_content_change
      onSelection:  @on_selection

  render: ->
    @$counter = $("<div class='rte-counter'>#{@rte.text().length}</div>").insertAfter(@$('> .form-wrapper'))
    @$('.rte-source-notice').toggle(@rte.source)

    @views = for klass in ['LinkView', 'FileView', 'ImageView', 'TableView']
      view = new Locomotive.Views.Inputs.Rte[klass](el: @el, rte: @rte)
      view.render()
      view

    @on_selection()

  run_command: (event) ->
    event.preventDefault()
    $link = $(event.target).closest('a')
    @rte.run($link.data('command'), $link.data('value'))
    $link.closest('.popover').prev('a').popover('hide')

  # the block types and the table commands
  open_dialog: (event) ->
    event.stopPropagation() & event.preventDefault()
    $button = $(event.target).closest('a')

    unless $button.data('bs.popover')
      $button.popover
        placement:  'bottom'
        content:    $button.next('.dialog-content').html()
        html:       true
        sanitize:   false
        trigger:    'manual'
        title:      undefined

    $button.popover('toggle')

  toggle_source: (event) ->
    event.preventDefault()
    @rte.toggleSource()
    @$('.rte-source-notice').hide()
    @on_selection()
    @resize()

  edit_link: ->
    @$('.rte-toolbar a.link').click() if @rte.isActive('link')

  expand: (event) ->
    event.stopPropagation() & event.preventDefault()

    $(@el).parents('.simple_form').toggleClass('rte-expanded')
    $(@el).parents('.inputs').toggleClass('expanded')
    $(@el).toggleClass('expanded')

    @$('.rte-toolbar a.style').popover('hide')

    @resize()

  on_content_change: ->
    @$counter?.html(@rte.text().length)

    PubSub.publish 'inputs.text_changed',
      view:     @
      content:  @$('textarea').val()

  # the state of the toolbar follows the selection
  on_selection: ->
    @$('.rte-toolbar a[data-command]').each (_, link) =>
      $(link).toggleClass('rte-command-active', @rte.isActive($(link).data('command'), $(link).data('value')))
    @$('.rte-toolbar').toggleClass('rte-source', @rte.source)
    @$('.rte-toolbar a.edit-table').toggle(@rte.isActive('table'))
    @$('.rte-toolbar a.table').toggle(!@rte.isActive('table'))

  highlight: (event) ->
    @rte.focus()

  resize: ->
    $content  = @$('.form-wrapper .rte-content')
    $textarea = @$('.form-wrapper textarea')
    $inputs   = $(@el).parents('.inputs')
    $wrapper  = @$('.form-wrapper')

    if $inputs.hasClass('expanded')
      for $target in [$content, $textarea]
        delta_height        = $wrapper.outerHeight() - $target.outerHeight()
        wrapper_max_height  = $(@el).height() - ($wrapper.outerHeight() - $wrapper.height() + parseInt($wrapper.css('margin-top')) + parseInt($(@el).css('padding-bottom')))
        height              = wrapper_max_height - delta_height

        $target.data('height', $target.css('min-height')) unless $target.data('height')?
        $target.css('min-height', height)
    else
      for $el in [$content, $textarea]
        $el.css('min-height', $el.data('height'))

  remove: ->
    _.invoke @views, 'remove'
    _.each @tokens, (token) -> PubSub.unsubscribe(token)
    @$('.rte-toolbar a.style, .rte-toolbar a.edit-table').popover('destroy')
    @rte.destroy()

    super()
