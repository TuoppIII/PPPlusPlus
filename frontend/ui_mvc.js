var app = {}; // create namespace for our app

//Models
app.TextArea = Backbone.Model.extend({
  defaults: {
  "message": 'Insert text here!'
  },
  idAttribute:"messageId",
  urlRoot: "/piratedpastie"
});
app.textArea = new app.TextArea();

//Views
app.Middle = Backbone.View.extend({
  el: $('#middle'),
  initialize: function(){
    this.render();
  },
  render: function(){
    console.log("rendering")
    this.$el.find('#textbox').val(app.textArea.get('message'));
  },

  events: {
    'click #edit' : 'edit',
    'click #save' : 'save'
  },
  edit: function(){
    console.log('Edit clicked!');
    app.router.navigate("/edit/"+app.textArea.id,true)
  },
  save: function(){
    console.log('Save clicked! ');
	app.textArea = new app.TextArea({message: this.$el.find('#textbox').val()});
    app.textArea.save({message: app.textArea.get('message')},{
	  success: function (model, response, options) {
		app.router.navigate("/id/"+app.textArea.get('messageId'),true)
      },
      error: function (model, response, options) {
        app.textArea.set('message',"Failed to save text to server!!\n\n"+ app.textArea.get('message'));
      },
	});
  },
  
  doAction: function(){
    console.log("doAction: "+window.filter);
    var box = this.$el.find('#textbox');
    box.val('');
    app.textArea = new app.TextArea({messageId: window.filter[1]});
    var _thisView = this;
    app.textArea.fetch({
      success: function (model, response, options) {
	     console.log("model: "+model+", response: "+response+", options: "+options);
		_thisView.render();
        switch(window.filter[0]){
          case 'edit':
            console.log("Editing...");
            box.prop('disabled', false);
            break;   
          case 'id':
            console.log("showing...");
            box.prop('disabled', true);
            break;
          default:
            break;
        }
      },
      error: function (model, response, options) {
        app.textArea.set('message',"Failed to retrieve text with id: "+app.textArea.id+"!");
		_thisView.render();
        box.prop('disabled', false);
        //app.router.navigate("",true);
      },
    });
  }
});	

// Routes
app.Router = Backbone.Router.extend({
  routes: {
	'*filter'	: 'setFilter'
  },
  setFilter: function(params) {
    if(params != null){
	  window.filter = params.trim().split('/') || [];
      console.log('app.router.params = ' + window.filter); // just for didactical purposes.
      app.middle.doAction();
    }
  }
});

app.router = new app.Router();
app.middle = new app.Middle();
Backbone.history.start();

