Locomotive.Views.Pages ||= {}

class Locomotive.Views.Pages.ListView extends Backbone.View

  el: '.pages-tree'

  initialize: ->
    super()
    if $('body').hasClass('pages')
      $('#collapsePages').addClass('in')

  render: ->
    @make_sortable()

    return @

  make_sortable: ->
    self = @

    @$('ul').sortable
      items:        '> li.page'
      handle:       '.draggable'
      axis:         'y'
      placeholder:  'sortable-placeholder'
      cursor:       'move'
      update: (event, ui)  ->
        self.call_sort $(@)
      stop: (event, ui) ->
        if $(@).hasClass('root')
          position = ui.item.index()
          $(@).sortable('cancel') if position == 0 || position >= $(@).find('> li').length - 2

  call_sort: (folder) ->
    $.rails.ajax
      url:        folder.data('url')
      type:       'post'
      dataType:   'json'
      data:
        children: (_.map folder.sortable('toArray'), (el) -> el.replace('node-', ''))
        _method:  'put'
      success:    @.on_successful_sort
      error:      @.on_failed_sort

  on_successful_sort: (data, status, xhr) ->
    Locomotive.notify decodeURIComponent(JSON.parse(xhr.getResponseHeader('X-Message'))), 'success'

    # maybe some components depends on it (ex: refreshing a menu if live editing is on)
    PubSub.publish 'pages.sorted'

  on_failed_sort: (data, status, xhr) ->
    Locomotive.notify decodeURIComponent(JSON.parse(xhr.getResponseHeader('X-Message'))), 'error'

