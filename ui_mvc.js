var app = {}; // create namespace for our app

//Helper variables
app.id = '0';

//Models
app.TextArea = Backbone.Model.extend({
      defaults: {
        text: 'Insert text here',
      }
    });

//Collections
app.TextAreaCollection = Backbone.Collection.extend({
    model: app.TextArea,
    localStorage: new Store("pastie-storage"),
	initialize: function(){
	}
});
app.textAreaCollection = new app.TextAreaCollection();

// Routes
app.Router = Backbone.Router.extend({
      routes: {
        '*filter' : 'setFilter'
      },
      setFilter: function(params) {
	    if(params != null){
			console.log('app.router.params = ' + params); // just for didactical purposes.
			window.filter = params.trim().split('/') || [];
			app.textAreaCollection.trigger('doAction');
		}
      }
    });
app.router = new app.Router();

//Views
app.Middle = Backbone.View.extend({
    el: $('#middle'),
    template: _.template("<%= area_text %>"),
    initialize: function(){
	 app.textAreaCollection.on('doAction', this.doAction, this);
	 app.textAreaCollection.fetch();
	 this.render();
    },
      render: function(){

    },
	  
	events: {
      'click #edit' : 'edit',
	  'click #save' : 'save'
    },
	edit: function(){
	  console.log('Edit clicked!');
	  app.router.navigate("/edit/"+app.id,true)
    },
	save: function(){
	  app.id = app.textAreaCollection.create(new app.TextArea({text: this.$el.find('#main_textbox').val()})).get('id');
      console.log('Save clicked!');
	  app.router.navigate("/id/"+app.id,true)
    },
	
	doAction: function(){
	  console.log("doAction: "+window.filter);
	  this.$el.find('#main_textbox').html('');
	  switch(window.filter[0]){
          case 'edit':
		     console.log("Editing...");
		    if (app.textAreaCollection.findWhere({id: window.filter[1]})) {
		      var box = this.$el.find('#main_textbox');
			  box.html(this.template({area_text: app.textAreaCollection.findWhere({id: window.filter[1]}).get('text')}));
			  this.$el.find('#main_textbox').prop('disabled', false);
			}
		    
            break;   
		  case 'id':
		     console.log("showing...");
		    if (app.textAreaCollection.findWhere({id: window.filter[1]})) {
		      var box = this.$el.find('#main_textbox');
			  box.html(this.template({area_text: app.textAreaCollection.findWhere({id: window.filter[1]}).get('text')}));
			  box.prop('disabled', true);
			  console.log("Showing end")
			}
		    break;
          default:
            break;
      }
	},
	
	setText: function(boolean) {
	
	}
	
});

Backbone.history.start();
app.middle = new app.Middle();