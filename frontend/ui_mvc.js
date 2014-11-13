var app = {}; // create namespace for our app

//Models
app.TextArea = Backbone.Model.extend({
  defaults: {
	"message": 'Insert text here!',
	"created": Date.now(),
	"oldId": '',
	"language": 'plain_text'
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
		app.textArea.set('message',app.textArea.defaults.message);
		app.middle.$el.find('#previous').hide();
		app.middle.$el.find('#feedback').text("");
		clearInterval(app.intervalId);
		app.router.navigate("",true);
	},
});

app.TextBox = Backbone.View.extend({
  el: $('#textbox'),
  initialize: function(){

  },
  render: function(){
	if (app.textArea.get('language') == "plain_text"){
		this.$el.val(app.textArea.get('message'));
	}
	else {
	console.log("Render2")
		variables = { 
			language_class: app.textArea.get('language'), 
			message: app.textArea.get('message'),
		};
		this.$el.html(_.template( $("#highlights").html(), variables ));
		Prism.highlightAll();
	}
  },
  getSize: function(){
	return this.$el.html().replace(/%[A-F\d]{2}/g, 'U').length;
  },
  getText: function(){
	return this.$el.text().trim();
  },
});

app.MiddleBottom = Backbone.View.extend({
	el: $('#middle-bottom'),
	initialize: function(){
	},
	render: function(){
		this.$el.find('#last_edited').text( "Last edited: " + 
		new Date(app.textArea.get('created')).toLocaleDateString() + " " + new Date(app.textArea.get('created')).toLocaleTimeString() );
    },
	events: {
	  'click #edit' : 'edit',
	  'click #save' : 'save',	
	},
	edit: function(){
	  clearInterval(app.intervalId);
      app.router.navigate("/edit/"+app.textArea.id,true);
    },
    save: function(){
	  clearInterval(app.intervalId);
	  //Check size is smaller than 10MB
	  if(encodeURIComponent(textbox.getSize < 5000000)){
	    app.textArea = new app.TextArea({message: textbox.getText, oldId: app.textArea.get("messageId")});
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
		app.middle.render();
	  }
  },
})

app.Middle = Backbone.View.extend({
  justSaved: false,
  msgTooLarge: false,
  el: $('#middle'),
  initialize: function(){
	this.$el.find('#language_selector').val(app.textArea.get('language'));
	this.textbox = new app.TextBox(),
	this.middleBottom = new app.MiddleBottom(),
    this.render();
  },
  render: function(){	
  this.$el.append(this.textbox.$el);
  this.$el.append(this.middleBottom.$el);
  this.textbox.render();
  this.middleBottom.render();
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
	this.$el.find('#previous').val(app.textArea.get('oldId'));
  },

  events: {
	'click #previous' : 'previous',
	'change #language_selector': 'languageSelected',
	'focus #textbox' : 'focus',
  },
  focus: function(){
		if(app.textArea.get('language') != "plain_text" && app.intervalId === undefined){
			app.intervalId = setInterval(function () {
				console.log("Moi");
				Prism.highlightAll();
			}, 3000);
		}
  },
  languageSelected: function() {
	app.textArea.set('language',this.$el.find('#language_selector').val());
	if(app.textArea.get('language') == "plain_text"){
		app.textArea.set("message",this.textbox.$el.html());
	}
	else{
		app.textArea.set("message",this.textbox.$el.find("#code").text());
	}
	this.render();
  },
  previous: function(){
    app.router.navigate("/id/"+app.textArea.get('oldId'),true);
  },
  doAction: function(){
    app.textArea = new app.TextArea({messageId: window.filter[1]});
    var _thisView = this;
    app.textArea.fetch({
      success: function (model, response, options) {
		_thisView.render();
        switch(window.filter[0]){
          case 'edit':
            _thisView.textbox.$el.attr('contentEditable',true);
			if(app.textArea.get('oldId') != ""){
				app.middle.$el.find('#previous').show();
			}
			else
			{
				app.middle.$el.find('#previous').hide();
			}
            break;   
          case 'id':
            _thisView.textbox.$el.attr('contentEditable', false);
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
        _thisView.textbox.$el.attr('contentEditable', true);
        app.router.navigate("/",true);
      }
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
app.title = new app.Title();
app.middle = new app.Middle();
Backbone.history.start();

