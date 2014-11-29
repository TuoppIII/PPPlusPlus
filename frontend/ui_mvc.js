var app = {}; // create namespace for our app
app.error = []; //Array for generic error messages

//generic errors
app.error["too_large"] = "Message size too large. Allowed size 5Mb!";
app.error["failed_save"] = "Failed to save text to server!!";

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
		//When clicking on page title then go to root url and clean all to defaults
		app.textArea.set('message',app.textArea.defaults.message);
		app.textArea.set('language', app.textArea.defaults.language)
		app.middle.$el.find('#language_selector').val(app.textArea.defaults.language)
		app.middle.$el.find('#previous').hide();
		app.middle.$el.find('#feedback').text("");
		app.router.navigate("",true);
	},
});

//The actual textarea
app.TextBox = Backbone.View.extend({
  el: $('#textbox'),
  initialize: function(){

  },
  render: function(){
	//If using highlights then use template and Prism highlight. Otherwise just show plain text
	if (app.textArea.get('language') == "plain_text"){
		this.$el.html(app.textArea.get('message'));
	}
	else {
		variables = { 
			language_class: app.textArea.get('language'), 
			message: app.textArea.get('message').split('<br>').join('\n'),
		};
		this.$el.html(_.template( $("#highlights").html(), variables ));
		Prism.highlightAll();
	}
  },
  getSize: function(){
	return this.$el.html().replace(/%[A-F\d]{2}/g, 'U').length;
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
      app.router.navigate("/edit/"+app.textArea.id,true);
    },
    save: function(){
	  //Check size is smaller than 5M
	  if(encodeURIComponent(app.middle.textbox.getSize < 5000000)){
		app.textArea.set('language',app.middle.$el.find('#language_selector').val());
		//Instead of using put for edited text just create a new textarea object with oldId attribute. Essentially it is a new object anyway. 
	    app.textArea = new app.TextArea({message: app.middle.textbox.$el.html(), oldId: app.textArea.get("messageId"), language: app.textArea.get('language')});
	    app.textArea.save({message: app.textArea.get('message')},{
	    	success: function (model, response, options) {
			app.middle.justSaved = true;
			save.disabled = true;
			edit.disabled = false;
			app.router.navigate("/id/"+app.textArea.get('messageId'),true)
	    	},
			error: function (model, response, options) {
				if(response.status == 507){
					app.middle.$el.find('#error').text(app.error.too_large);
				}
				else{
					app.middle.$el.find('#error').text(app.error.failed_save);
				}
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
	//Connect the two subviews to this view
	this.$el.append(this.textbox.$el);
	this.$el.append(this.middleBottom.$el);
	this.textbox.render();
	this.middleBottom.render();
	//check if saving the pastie had errors. 
	if(!this.justSaved && !this.msgTooLarge){
		this.$el.find('#feedback').text("");
	}
	else if(this.justSaved){
		this.$el.find('#feedback').text("Save successful! Text id: " + app.textArea.get('messageId'));
		this.justSaved = false;
	}
	else if(this.msgTooLarge){
		this.$el.find('#error').text(app.error.too_large);
		this.msgTooLarge = false;
	}
	//set the link to previous version
	this.$el.find('#previous').val(app.textArea.get('oldId'));
  },
  events: {
    'click #previous' : 'previous',
    'focus #textbox' : 'focus',
  },
  focus: function(){
	//When focusing in the root url then clean the default text. I bet this could be done easier.
    if(this.textbox.$el.html() == app.textArea.defaults.message && Backbone.history.fragment.length == 0){
      this.textbox.$el.html(''); 
    }
  },
  previous: function(){
    app.router.navigate("/id/"+app.textArea.get('oldId'),true);
  },
  //when going to #/edit/{id} or #/id/{id} url the magick happens underneath
  doAction: function(){
	//get the id filter
    app.textArea = new app.TextArea({messageId: window.filter[1]});
	//instantiate this view so we can use it in save & error functions when necessary
    var _thisView = this;
    app.textArea.fetch({
      success: function (model, response, options) {
          switch(window.filter[0]){
            case 'edit':
              _thisView.textbox.$el.attr('contentEditable',true);
    		  save.disabled = false;
			  edit.disabled = true;
			  app.textArea.set('language', app.textArea.defaults.language);
			  app.textArea.set('message',app.textArea.get('message'));
              if(app.textArea.get('oldId') != ""){
                app.middle.$el.find('#previous').show();
              }
              else{
                app.middle.$el.find('#previous').hide();
              }
              break;   
            case 'id':
              _thisView.textbox.$el.attr('contentEditable', false);
			  save.disabled = true;
			  edit.disabled = false;
			  _thisView.$el.find('#language_selector').val(app.textArea.get('language'));
              if(app.textArea.get('oldId') != ""){
                app.middle.$el.find('#previous').show();
              }
              else{
                app.middle.$el.find('#previous').hide();
              }
              break;
            default:
              break;
          }
		  _thisView.render();
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
    else{
      app.middle.textbox.$el.attr('contentEditable', true);
	  save.disabled = false;
	  edit.disabled = true;
      app.middle.render();
    }
  }
});

app.router = new app.Router();
app.title = new app.Title();
app.middle = new app.Middle();
Backbone.history.start();
