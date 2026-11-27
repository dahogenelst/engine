#= require ../../content_assets/picker_view

Locomotive.Views.Inputs.Rte ||= {}

# Inserts a link to a file picked from the assets (ImageView: an image)
class Locomotive.Views.Inputs.Rte.FileView extends Backbone.View

  button: '.rte-toolbar a.file'
  images: false # the paperclip links to any file, an image too

  initialize: ->
    _.bindAll(@, 'show', 'insert_file')

    @opened       = { picker: false } # also closed by the picker (content_assets/index_view)
    @rte          = @options.rte
    @$link        = @$(@button)

    @pubsub_token = PubSub.subscribe('file_picker.select', @insert_file)

  render: ->
    @$link.on 'click', @show

  show: (event) ->
    event.preventDefault()
    @show_picker()

  insert_file: (msg, data) ->
    return unless data.parent_view.cid == @.cid

    if @images
      @rte.image(src: data.url, title: data.title, alt: data.alt)
    else
      @rte.file(url: data.url, title: data.title)

    @hide_picker()

  show_picker: ->
    if @opened.picker == false
      window.application_view.drawer_view.open(
        @$link.data('url'),
        Locomotive.Views.ContentAssets.PickerView,
        { parent_view: @ })
      @opened.picker = true

  hide_picker: ->
    window.application_view.drawer_view.close()
    @opened.picker = false

  hide_from_picker: (stack_size) ->
    if stack_size == 0
      @opened.picker = false

  remove: ->
    @$link.off 'click', @show
    PubSub.unsubscribe(@pubsub_token)
