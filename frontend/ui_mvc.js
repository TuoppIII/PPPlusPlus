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
app.Title = Backbone.View.extend({
	el: $('#title'),
	initialize: function(){
		this.render();
	},
	render: function(){
	},
	events: {
		'click #title_button' : 'title_button'
	},
	title_button: function(){
		app.middle.$el.find('#textbox').text("Insert text here!");
		app.middle.$el.find('#previous').hide();
		app.middle.$el.find('#feedback').text("");
		app.router.navigate("",true);
	},
});

app.Middle = Backbone.View.extend({
  justSaved: false,
  msgTooLarge: false,
  el: $('#middle'),
  initialize: function(){
    this.render();
  },
  render: function(){
	if(!this.justSaved && !this.msgTooLarge){
		this.$el.find('#feedback').text("");
	}
	else if(this.justSaved){
		this.$el.find('#feedback').text("Save successful! Text id: " + app.textArea.get('messageId'));
		this.justSaved = false;
	}
	else if(this.msgTooLarge){
		this.$el.find('#error').text("Message size too large. Allowed size 5Mb." );
		this.msgTooLarge = false;
	}
	this.$el.find('#textbox').html(app.textArea.get('message'));
	this.$el.find('#previous').val(app.textArea.get('oldId'));
	this.$el.find('#last_edited').text( "Last edited: " + 
		new Date(app.textArea.get('created')).toLocaleDateString() + " " + new Date(app.textArea.get('created')).toLocaleTimeString() );
  },

  events: {
    'click #edit' : 'edit',
    'click #save' : 'save',
	'click #previous' : 'previous',
  },
  edit: function(){
    app.router.navigate("/edit/"+app.textArea.id,true)
  },
  save: function(){
	//Check size is smaller than 10MB
	if(encodeURIComponent(this.$el.find('#textbox').html()).replace(/%[A-F\d]{2}/g, 'U').length < 5000000){
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
	}
	else{
		app.middle.msgTooLarge = true;
		this.render();
	}
  },
  previous: function(){
    app.router.navigate("/id/"+app.textArea.get('oldId'),true);
  },
  doAction: function(){
    var box = this.$el.find('#textbox');
    app.textArea = new app.TextArea({messageId: window.filter[1]});
    var _thisView = this;
    app.textArea.fetch({
      success: function (model, response, options) {
		_thisView.render();
        switch(window.filter[0]){
          case 'edit':
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
	  console.log('app.router.params = ' + window.filter); 
	  window.filter = params.trim().split('/') || [];
      console.log('app.router.params = ' + window.filter); // just for didactical purposes.
      app.middle.doAction();
    }
  }
});

app.router = new app.Router();
app.title = new app.Title();
app.middle = new app.Middle();
Backbone.history.start();

