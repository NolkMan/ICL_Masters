var https = require('https');
var fs    = require('fs');

var hostname = '127.0.0.1';
var port = 4333;

const server_options = {
	key: fs.readFileSync('./ssl/reporting.project-key.pem'),
	cert: fs.readFileSync('./ssl/reporting.project.pem'),
}


function requestHandler(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
}

var server = https.createServer(server_options, requestHandler);

server.listen(port, hostname, function () {
    console.log("Reporting server running at http://".concat(hostname, ":").concat(String(port), "/"));
});
