const EventEmitter = require('events');

const https = require('https');
const fs    = require('fs');


var hostname = '127.0.0.1';
var port = 4333;

const ee = new EventEmitter();

const server_options = {
	key: fs.readFileSync(__dirname + '/ssl/reporting.project-key.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/reporting.project.pem'),
}


function requestHandler(req, res) {
	if (req.method != 'POST'){
		req.socket.destroy()
	}
	var body = ''
	req.on('data', function(data) {
		body += data;
	})
	req.on('end', function() {
		console.log('report: ' + body)
		req.socket.destroy()
	})
}

var server = https.createServer(server_options, requestHandler);

server.listen(port, hostname, function () {
    console.log("Reporting server running at http://".concat(hostname, ":").concat(String(port), "/"));
});

module.exports = {
	'on': ee.on,
}
