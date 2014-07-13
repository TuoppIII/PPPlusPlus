var app = {}; // create namespace for our app

//Helper variables
app.id = '0';

//Models
app.TextArea = Backbone.Model.extend({
      defaults: {
	    "id" : '',
        "message": 'Insert text here'
      },
	  urlRoot: "http://localhost:3000/piratedpastie"
    });
app.textArea = new app.TextArea();

// Routes
app.Router = Backbone.Router.extend({
      routes: {
        '*filter' : 'setFilter'
      },
      setFilter: function(params) {
	    if(params != null){
			console.log('app.router.params = ' + params); // just for didactical purposes.
			window.filter = params.trim().split('/') || [];
			app.textArea.trigger('doAction');
		}
      }
    });
app.router = new app.Router();

//Views
app.Middle = Backbone.View.extend({
    el: $('#middle'),
    template: _.template("<%= area_text %>"),
    initialize: function(){
	 app.textArea.on('doAction', this.doAction, this);
	 this.render();
    },
    render: function(){
	  console.log("rendering")
	  this.$el.find('#main_textbox').html(this.template({area_text: app.textArea.get('message')}));
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
      console.log('Save clicked!');
	  console.log(app.textArea.save({"message": this.$el.find('#main_textbox').val()}));
	  app.router.navigate("/id/"+app.textArea.id,true)
    },
	
	doAction: function(){
	  console.log("doAction: "+window.filter);
	  var box = this.$el.find('#main_textbox');
	  box.html('');
	  app.textArea.clear();
	  app.textArea.set('id', window.filter[1]);
	  var _thisView = this;
	  app.textArea.fetch({
	    success: function (model, response, options) {
		  _thisView.render();
		},
		error: function (model, response, options) {
		  app.textArea.set('message',"Failed to retrieve text with id: "+app.textArea.id+"!");
		  box.prop('disabled', false);
		  _thisView.render();
		  //app.router.navigate("",true);
		},
      });
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
	}	
});

Backbone.history.start();
app.middle = new app.Middle();