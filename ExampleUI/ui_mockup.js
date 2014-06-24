(function($){
  
  var MainView = Backbone.View.extend({
    el: $("#middle"), // attaches `this.el` to an existing element.
    initialize: function(){
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods

       this.render(); // not all views are self-rendering. This one is.
    },
    // `render()`: Function in charge of rendering the entire view in `this.el`. Needs to be manually called by the user.
    render: function(){
      //$(this.el).append("<ul> <li>hello world</li> </ul>");
    }
  });

  // **listView instance**: Instantiate main app view.
  var mainView = new MainView();
})(jQuery);