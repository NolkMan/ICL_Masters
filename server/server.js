var http = require('http');
var hostname = '127.0.0.1';
var port = 3000;

function requestHandler(req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
}

var server = http.createServer(requestHandler);

server.listen(port, hostname, function () {
    console.log("Server running at http://".concat(hostname, ":").concat(port, "/"));
});
