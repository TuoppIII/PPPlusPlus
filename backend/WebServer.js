var http = require('http'),  
	url = require('url'), 
	fs = require('fs'),
	path = require('path'),
    winston = require('winston'), 
	journey = require('journey'),
	Datastore = require('nedb'),
	schedule = require('node-schedule');
	

/* Source: http://blog.nodejitsu.com/a-simple-webservice-in-nodejs/ */	
/* Requires "winston" logger: npm install winston */
/* Requires "journey" router: npm install journey */
/* Requires "nodejs-microdb": npm install nedb */

/* Testable with http-console: 
	npm install http-console
	node.exe node_modules\http-console\bin\http-console localhost:30001 
	http://localhost:3000/> .j            -----> Changes "Content-Type: application/json"
	http://localhost:3000/> post piratedpastie
	... { "message":"Test text for Pirated Pastie" }
	http://localhost:3000/> get piratedpastie
	http://localhost:3000/> get piratedpastie/0
*/

//var pastieMessages = new Array(); // Use standard object's associative array as message storage
var messageDB = new Datastore({ filename: 'PiratedPastie.db', autoload: true });

//Schedule a removal of old data everyday at 5am 
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 5;
rule.minute = 0;

var j = schedule.scheduleJob(rule, function(){
    var removeOlder = new Date()
	removeOlder.setDate(tst.getDate() - 30)
	messageDB.remove( { messageID: { $lt: removeOlder}},{}, function (err, numRemoved) {
		winston.info("removal found " + numRemoved + " document(s). " + err);
		winston.info("removing...")
	});
});


var contentTypesByExtension = {
	'.html': "text/html",
	'.css':  "text/css",
	'.js':   "text/javascript"
};

/**
 * Creates the server for the pinpoint web service
 * @param {int} port: Port for the server to run on
 */
exports.createServer = function (port) {  
  var server = http.createServer(function (request, response) {
    var body = '';
    var router = exports.createRouter();
	
    winston.info('Incoming Request', { url: request.url });
    winston.info('Incoming Request', { method: request.method });

    request.on('data', function (chunk) {
      body += chunk;
    });

	request.on('end', function () {  
	  //
	  // Dispatch the request to the router
	  //
	  //winston.info("body: " + body);
	  winston.info( url.parse(request.url).pathname );
	  
	  if ( request.url.match(/piratedpastie/) ) {
		// Handle Web Service request
		  router.handle(request, body, function (result) {
			response.writeHead(result.status, result.headers);
			response.end(result.body);
		  });
	  } else {
		// Serve static html pages from ../frontend -directory
		var uri = url.parse(request.url).pathname
			, filename = path.join(process.cwd(), '../frontend', uri);
		
		winston.info("Serve page: " + uri);
		
		fs.exists(filename, function(exists) {
			if(!exists) {
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}
 
			if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
			fs.readFile(filename, "binary", function(err, file) {
				if(err) {        
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.write(err + "\n");
					response.end();
					return;
				}
 
				var headers = {};
				var contentType = contentTypesByExtension[path.extname(filename)];
				if (contentType) headers["Content-Type"] = contentType;
				response.writeHead(200, headers);
				response.write(file, "binary");
				response.end();
			});
		});
	  }
	});
  });
  
  if (port) {
    server.listen(port);
  }

  return server;
};

exports.createRouter = function () {  
	var router = new (journey.Router)( { strict: false } );
    
    router.path(/\/piratedpastie/, function () {
      //
      // LIST: GET to /bookmarks lists all bookmarks
      //
      this.get().bind(function (req, res) {
		messageDB.find({}, function (err, docs) {
			winston.info("get, number of messages: " + docs.length);
			var result = "";
			for ( var doc in docs ) {
				result += "" +docs[doc].messageID + ", ";
			}
			if ( docs.length > 0 ) {
				res.send(200, {}, { action: 'list', data: result} );
			} else {
				res.send(404, {}, { action: 'list' } );
			}
		});
		
      });

      //
      // SHOW: GET to /bookmarks/:id shows the details of a specific bookmark 
      //
      this.get(/\/([\w|\d|\-|\_]+)/).bind(function (req, res, id) {
		winston.info("get with id: " + id);
		
		// Return message with given MessageId, if found.
		
		messageDB.count({}, function (err, count) {
			winston.info("Number of documents: " + count);
		});
				
		messageDB.find( { messageID: id }, function (err, docs) {
			winston.info("found " + docs.length + " document(s). " + err);
			winston.info("docs:" + docs + "/" + docs["messageID"]);
			for ( var doc in docs ) {
				winston.info("doc:" + doc);
				winston.info("found:" + docs[doc].length + "/" + docs[doc].messageID + "/" + docs[doc].text);
			}
			if ( docs.length > 0 ) {
				res.send(200, {}, { action: 'show', message: docs[0].text, created: docs[0].created, oldId: docs[0].oldId} );
			} else {
				res.send(404, {}, { action: 'show' } );
			}
		});
	  });

      //
      // CREATE: POST to /bookmarks creates a new bookmark
      //
      this.post().bind(function (req, res, data) {
		winston.info("post: " + req + "/" + res + "/" + data );
		
		for (var i in data) {
			winston.info( "reg: " + i + "/" + data[i] );
		}
		
		// Save new message and return MessageID associated to it
		var messageID = new Date().getTime(); // TODO There is a slight possibility for two messages to receive same ID. Use something unique from the request as part of the key as well?
		var createdDate = new Date().getTime();
		var message = { messageID: messageID, text: data.message, created: createdDate, oldId: data.oldId};
		winston.info( "message: " + message ); 
		messageDB.insert( message, function (err, newDoc) { 
			winston.info("message saved with MessageID: " + newDoc.messageID + "/" + newDoc._id);
			res.send(200, {}, { action: 'create', messageId: newDoc.messageID, id:  newDoc._id} );
		});
      });

      //
      // UPDATE: PUT to /bookmarks updates an existing bookmark
      //
      this.put(/\/([\w|\d|\-|\_]+)/).bind(function (req, res, bookmark) {
		winston.info("put: " + bookmark );
		
		// TODO Update message associated to given MessageID
		
        res.send(501, {}, { action: 'update' });
      });

      //
      // DELETE: DELETE to /bookmarks/:id deletes a specific bookmark
      //
      this.del(/\/([\w|\d|\-|\_]+)/).bind(function (req, res, id) {
		winston.info("del: " + id);
		
		// TODO Delete message with given MessageID
		
        res.send(501, {}, { action: 'delete' });
      });
    });
	
	return router;
};


var testobject = { name:'test', version:'1.0'};
//winston.info( "object:" + testobject );

exports.createServer(30001);
