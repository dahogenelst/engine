Locomotive.Views.Inputs.Rte ||= {}

class Locomotive.Views.Inputs.Rte.LinkView extends Backbone.View

  isOpen: false

  initialize: ->
    _.bindAll(@, 'apply', 'show', 'hide')

    @rte        = @options.rte
    @$link      = @$('.rte-toolbar a.link')
    @$content   = @$link.next('.link-dialog-content')

  render: ->
    @create_popover()
    @attach_events()

  create_popover: ->
    @$content.show()
    @$link.popover
      container:  @$link.parents('fieldset')
      placement:  'bottom'
      content:    @$content
      html:       true
      sanitize:   false
      trigger:    'manual'
      template:   '<div class="popover" role="tooltip"><div class="arrow"></div><form class="simple_form"><div class="popover-content"></div></form></div>'
    @$link.data('bs.popover').setContent()

  attach_events: ->
    @$link.on 'click', @show
    @$content.on 'click', '.apply', @apply
    @$content.on 'click', '.cancel', @hide

  detach_events: ->
    @$link.off 'click', @show
    @$content.off 'click', '.apply', @apply
    @$content.off 'click', '.cancel', @hide

  apply: (event) ->
    event.preventDefault()
    url = @_input_el('url').val()

    unless _.isEmpty(url)
      @rte.link
        href:   url
        target: @_input_el('target', 'select').val()
        title:  @_input_el('title').val()

    @hide()

  # filled with the link under the cursor, if any
  show: (event) ->
    event?.preventDefault()
    return @hide() if @isOpen

    link = @rte.editor.getAttributes('link')

    # Make sure the select2 behavior is always enabled
    $target = @_input_el('target', 'select')
    $target.select2()
    $target.data('select2').$dropdown.addClass('rte-select2-dropdown')

    @_input_el('url').val(link.href || '')
    $target.val(link.target || '').trigger('change')
    @_input_el('title').val(link.title || '')

    @$link.popover('show')
    @_input_el('url').trigger('focus') # first field

    @isOpen = true

  hide: (event) ->
    event?.preventDefault()
    @_input_el('target', 'select').select2('close')
    @$link.popover('hide')
    @isOpen = false

  _input_el: (property, type) ->
    type ||= 'input'
    name = "rte_input_link_form[#{property}]"
    @$content.find("#{type}[name=\"#{name}\"]")

  remove: ->
    @detach_events()
    @$link.popover('destroy')
    @$('.popover').remove()
