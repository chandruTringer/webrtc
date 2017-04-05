// Setup basic express server
var fs = require('fs');
var auth = require('http-auth');
var https = require('https');
var express = require('express');
var socketIO = require('socket.io');
var bodyParser = require('body-parser');
var socketConnection = require('./server/socketConnection');

// Authentication module.
var basic = auth.basic({
	realm: "tringapps Inc.",
	file: __dirname + "/htpasswd"
});

// Setup basic express server

var app = express();
var options = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt')
};
// Application setup.
app.use(auth.connect(basic));
app.use(bodyParser.json());
var server = https.createServer(options, app);
var io = socketIO(server);

var port = 443;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var User = require('./models/user.js');


// Routing
app.use(express.static(__dirname + '/public'));

app.get('/_api/user/create/:_id', ( request, response ) => {
  var id = request.params._id;
  User.addUser({userId : id}, (err, successResponse) => {
    console.log(err);
		if(err){
			throw err;
		}
		console.log(successResponse);
		console.log("CREATED: "+id);
		response.json(successResponse);
	});
});

app.post('/_api/user/send_message', ( request, response ) => {
  var data = request.body;
	User.findUserByUserId(data.sendTo, function(err, user){

	  if(err) throw err;

	  if(user.length > 0){
	    console.log("IN SEND MESSAGE USER",user[0].userId, data.message.type);
	    var sendTo = user[0].socketId;
	    var message = data.message;
	    if(sendTo){
	      io.sockets.connected[sendTo].send(data);
	    } else {
	      console.log("Unknow user id");
	    }
	  } else {
      console.log("Throw unknown user error");
    }
	});
});

io.on('connection', socketConnection);
