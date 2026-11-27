Locomotive.Views.Inputs.Rte ||= {}

class Locomotive.Views.Inputs.Rte.TableView extends Backbone.View

  initialize: ->
    _.bindAll(@, 'apply', 'apply_on_enter', 'show', 'hide')

    @rte      = @options.rte
    @$link    = @$('.rte-toolbar a.table')
    @$content = @$link.next('.table-dialog-content')

  render: ->
    return if @$link.length == 0

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

    @$link.on 'click', @show
    @$content.on 'click', '.apply',  @apply
    @$content.on 'click', '.cancel', @hide
    @$content.on 'keydown', 'input', @apply_on_enter

  apply_on_enter: (event) ->
    @apply(event) if event.key == 'Enter'

  apply: (event) ->
    event.preventDefault()
    @rte.table
      cols:       parseInt(@_input_el('cols').val()) || 1
      rows:       parseInt(@_input_el('rows').val()) || 1
      className:  @_input_el('class_name').val()
      head:       @_input_el('head').last().bootstrapSwitch('state')

    @hide()

  show: (event) ->
    event.preventDefault()
    @$content.parents('form')[0].reset()
    @$link.popover('toggle')

  hide: (event) ->
    event?.preventDefault()
    @$link.popover('hide')

  _input_el: (property, type) ->
    type ||= 'input'
    name = "rte_input_table_form[#{property}]"
    @$content.find("#{type}[name=\"#{name}\"]")

  remove: ->
    return if @$link.length == 0
    @$link.off 'click', @show
    @$content.off 'click', '.apply',  @apply
    @$content.off 'click', '.cancel', @hide
    @$content.off 'keydown', 'input', @apply_on_enter
    @$link.popover('destroy')
