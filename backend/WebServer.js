var http = require('http'),  
	url = require('url'), 
	fs = require('fs'),
	path = require('path'),
	winston = require('winston'), 
	journey = require('journey'),
	Datastore = require('nedb'),
	schedule = require('node-schedule');
	config = require('nconf');
	
/* Dependencies are handled by npm using package.json */
/* Installation: npm install */

/* Testable with http-console: 
	npm install http-console
	node.exe node_modules\http-console\bin\http-console localhost:30001 
	http://localhost:3000/> .j            -----> Changes "Content-Type: application/json"
	http://localhost:3000/> post piratedpastie
	... { "message":"Test text for Pirated Pastie" }
	http://localhost:3000/> get piratedpastie
	http://localhost:3000/> get piratedpastie/0
*/

var testobject = { name:'test', version:'1.0'};
//winston.info( "object:" + testobject );

var rule = new schedule.RecurrenceRule();

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
		messageDB.find( {}, function (err, docs) {
			winston.info("get, number of messages: " + docs.length);
			var result = "";
			for ( var doc in docs ) {
				result += "" +docs[doc]._id + ", ";
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
		winston.info("get message with id: " + id);
		
		// Return message with given MessageId, if found.
		messageDB.find( { _id: id }, function (err, docs) {
			winston.info("found " + docs.length + " document(s). Err: " + err);
			for ( var doc in docs ) {
				winston.info("found:" + docs[doc].length + "/" + docs[doc]._id + "/" + docs[doc].text);
			}
			if ( docs.length > 0 ) {
				res.send(200, {}, { action: 'show', message: docs[0].text, created: docs[0].created, oldId: docs[0].oldId} );
			} else {
				// Propably messgageID was used, test with that also
				messageDB.find( { messageID: id }, function (err, docs) {
					winston.info("found " + docs.length + " document(s) with messageID. Err: " + err);
					if ( docs.length > 0 ) {
						res.send(200, {}, { action: 'show', message: docs[0].text, created: docs[0].created, oldId: docs[0].oldId} );
					} else {
						res.send(404, {}, { action: 'show' } );
					}
				} );
			}
		});
	  });

      //
      // CREATE: POST to /bookmarks creates a new bookmark
      //
      this.post().bind(function (req, res, data) {
				
		// Save new message and return MessageID associated to it
		var createdDate = new Date().getTime();
		var message = { text: data.message, created: createdDate, oldId: data.oldId};
		winston.info( "message: " + message ); 
		messageDB.insert( message, function (err, newDoc) { 
			winston.info("message saved with ID: " + newDoc._id);
			res.send(200, {}, { action: 'create', messageId: newDoc._id, id:  newDoc._id} );
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

/** Main code block start here **/

// Configuration for the server
config.argv()
       .env()
       .file({ file: 'piratedpastie.config' });

winston.info("cleanup: " + config.get('cleanup-hour') + ":" + config.get('cleanup-minute') );

var messageDB = new Datastore({ filename: config.get("database_name"), autoload: true });

//Schedule a removal of old data everyday at 5am 
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = config.get('cleanup-hour');
rule.minute = config.get('cleanup-minute');

var j = schedule.scheduleJob(rule, function() {
	var removeOlder = new Date();
	removeOlder.setDate( tst.getDate() - config.get( "cleanup-age" ) )
	messageDB.remove( { created: { $lt: removeOlder}},{}, function (err, numRemoved) {
		winston.info("removal found " + numRemoved + " document(s). " + err);
		winston.info("removing...")
	});
});

exports.createServer(30001);

