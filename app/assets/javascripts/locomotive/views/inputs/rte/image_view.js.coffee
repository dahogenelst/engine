#= require ./file_view

Locomotive.Views.Inputs.Rte ||= {}

# Inserts an image picked from the assets, or edits the selected image (src, title, alt, alignment)
class Locomotive.Views.Inputs.Rte.ImageView extends Locomotive.Views.Inputs.Rte.FileView

  button: '.rte-toolbar a.image'
  images: true

  initialize: ->
    super()
    _.bindAll(@, 'apply', 'hide_popover')
    @$popover = @$link.next('.image-dialog-content')

  render: ->
    super()
    @$popover.show()
    @$link.popover
      container:  '.main'
      placement:  'left'
      content:    @$popover
      html:       true
      sanitize:   false
      trigger:    'manual'
      template:   '<div class="popover" role="tooltip"><div class="arrow"></div><form class="simple_form"><div class="popover-content"></div></form></div>'
    @$link.data('bs.popover').setContent()

    @$popover.on 'click', '.apply', @apply
    @$popover.on 'click', '.cancel', @hide_popover

  show: (event) ->
    event.preventDefault()
    return @show_picker() unless @rte.isActive('image')

    image = @rte.editor.getAttributes('image')
    @_input_el('src').val(image.src)
    @_input_el('alignment', 'select').val(image.class || '')
    @_input_el('title').val(image.title)
    @_input_el('alt').val(image.alt)
    @$link.popover('show')

  apply: (event) ->
    event.preventDefault()
    @rte.image
      src:    @_input_el('src').val()
      class:  @_input_el('alignment', 'select').val() || null
      title:  @_input_el('title').val() || null
      alt:    @_input_el('alt').val() || null
    @hide_popover()

  hide_popover: (event) ->
    event?.preventDefault()
    @$link.popover('hide')

  _input_el: (property, type) ->
    type ||= 'input'
    @$popover.find("#{type}[name=\"rte_input_image_form[#{property}]\"]")

  remove: ->
    @$popover.off 'click', '.apply', @apply
    @$popover.off 'click', '.cancel', @hide_popover
    @$link.popover('destroy')
    super()
