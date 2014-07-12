var http = require('http'),  
    winston = require('winston'), 
	journey = require('journey'),
	Datastore = require('nedb');

/* Source: http://blog.nodejitsu.com/a-simple-webservice-in-nodejs/ */	
/* Requires "winston" logger: npm install winston */
/* Requires "journey" router: npm install journey */
/* Requires "nodejs-microdb": npm install nedb */

/* Testable with http-console: 
	npm install http-console
	node.exe node_modules\http-console\bin\http-console localhost:3000 
	http://localhost:3000/> .j            -----> Changes "Content-Type: application/json"
	http://localhost:3000/> post piratedpastie
	... { "text":"Test text for Pirated Pastie" }
	http://localhost:3000/> get piratedpastie
	http://localhost:3000/> get piratedpastie/0
*/
	
//var pastieMessages = new Array(); // Use standard object's associative array as message storage
var messageDB = new Datastore({ filename: 'PiratedPastie.db', autoload: true });

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
	  winston.info("body: " + body);
	  router.handle(request, body, function (result) {
		response.writeHead(result.status, result.headers);
		response.end(result.body);
	  });
	});

    //response.writeHead(501, { 'Content-Type': 'application/json' });
    //response.end(JSON.stringify({ message: 'not implemented!' }));
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
		//winston.info("get, number of messages: " + pastieMessages.length);
		var pastieMessages = messageDB.findAllWithKey("messageID");
		winston.info("get, number of messages: " + nrOfMessages.length);

		// TODO List all availabe MessageID's of messages
		var result = "";
		for ( var i in pastieMessages ) {
			result += "" + i + ", ";
		}
		
        res.send(200, {}, { action: 'list', data : result });
      });

      //
      // SHOW: GET to /bookmarks/:id shows the details of a specific bookmark 
      //
      this.get(/\/([\w|\d|\-|\_]+)/).bind(function (req, res, id) {
		winston.info("get with id: " + id);
		
		// Return message with given MessageId, if found.
        //res.send(501, {}, { action: 'show', message: pastieMessages[id] });
		
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
				res.send(200, {}, { action: 'show', message: docs[0].text} );
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
		//var messageID = pastieMessages.length;
		//pastieMessages[ messageID ] = data.text; 
		var messageID = new Date().getTime();
		var message = { messageID: messageID , text: data.text};
		messageDB.insert( message );
		winston.info("message saved with MessageID: " + messageID);
		
        res.send(200, {}, { action: 'create', messageId: messageID });
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

exports.createServer(3000);
