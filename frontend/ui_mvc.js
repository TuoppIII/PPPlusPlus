var app = {}; // create namespace for our app

//Models
app.TextArea = Backbone.Model.extend({
  defaults: {
	"message": 'Insert text here!',
	"created": '',
	"oldId": '',
  },
  idAttribute:"messageId",
  urlRoot: "/piratedpastie",
});
app.textArea = new app.TextArea();

//Views
app.Middle = Backbone.View.extend({
  justSaved: false,
  el: $('#middle'),
  initialize: function(){
    this.render();
  },
  render: function(){
    console.log("rendering");
	if(!this.justSaved){
		this.$el.find('#feedback').text("");
	}
	else if(this.justSaved){
		this.$el.find('#feedback').text("Save successful! Text id: " + app.textArea.get('messageId'));
		this.justSaved = false;
	}
	this.$el.find('#textbox').html(app.textArea.get('message'));
	this.$el.find('#previous').val(app.textArea.get('oldId'));
	this.$el.find('#last_edited').text( "Last edited: " + 
		new Date(app.textArea.get('created')).toLocaleDateString() + " " + new Date(app.textArea.get('created')).toLocaleTimeString() );
  },

  events: {
    'click #edit' : 'edit',
    'click #save' : 'save',
	'click #previous' : 'previous'
  },
  edit: function(){
    console.log('Edit clicked!');
    app.router.navigate("/edit/"+app.textArea.id,true)
  },
  save: function(){
    console.log('Save clicked! ');
	app.textArea = new app.TextArea({message: this.$el.find('#textbox').html(), oldId: app.textArea.get("messageId")});
    app.textArea.save({message: app.textArea.get('message')},{
	  success: function (model, response, options) {
		app.middle.justSaved = true;
		app.router.navigate("/id/"+app.textArea.get('messageId'),true)
      },
      error: function (model, response, options) {
        app.textArea.set('message',"Failed to save text to server!!\n\n"+ app.textArea.get('message'));
      },
	});
  },
  previous: function(){
    console.log('previous clicked!');
    app.router.navigate("/id/"+app.textArea.get('oldId'),true)
  },
  
  doAction: function(){
    console.log("doAction: "+window.filter);
    var box = this.$el.find('#textbox');
    app.textArea = new app.TextArea({messageId: window.filter[1]});
    var _thisView = this;
    app.textArea.fetch({
      success: function (model, response, options) {
	     console.log("model: " + model + ", response: " + response + ", options: " + options);
		_thisView.render();
        switch(window.filter[0]){
          case 'edit':
            console.log("Editing...");
            box.attr('contentEditable',true);
			if(app.textArea.get('oldId') != ""){
				app.middle.$el.find('#previous').show();
			}
			else
			{
				app.middle.$el.find('#previous').hide();
			}
            break;   
          case 'id':
            console.log("showing...");
            box.attr('contentEditable', false);
			if(app.textArea.get('oldId') != ""){
				app.middle.$el.find('#previous').show();
			}
			else
			{
				app.middle.$el.find('#previous').hide();
			}
            break;
          default:
            break;
        }
      },
      error: function (model, response, options) {
        app.textArea.set('message',"Failed to retrieve text with id: "+app.textArea.id+"!");
		app.textArea = new app.TextArea();
		_thisView.render();
        box.attr('contentEditable', true);
        app.router.navigate("/",true);
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

