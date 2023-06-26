/* 
 * A basic http server so information can flow to mitmproxy
 * This is to imitation the control over the main server
 */

const http = require('http')

var hostname = '127.0.0.1';
var port = 8181;

var csp_host = ''
var cspro = ''

/**
 * @param req {http.IncomingMessage}
 * @param res {http.ServerResponse}
 */
function requestHandler(req, res) {
	if (req.method == 'POST') {
		var body = ''
		req.on('data', function(data) {
			body += data;
		})
		req.on('end', function() {
			console.log("mitm server pinged at: ".concat(String(Date.now())))
			res.statusCode = 200;
			res.setHeader('Content-Type', 'text/json');
			res.end(JSON.stringify(
				{
					'cspro': cspro,
					'csp_host': csp_host,
					'refresh': Date.now() + 200
				}
			));
		})
	}
	else {
		res.statusCode = 404;
		res.setHeader('Content-Type', 'text/plain');
		res.end('Nothing here\n');
	}
}

function set_csp_host(host){
	csp_host = host;
}

function set_cspro(new_cspro){
	cspro = new_cspro;
}

var server = http.createServer(requestHandler);

server.listen(port, hostname, function () {
    console.log("Mitm communication server running at http://".concat(hostname, ":").concat(String(port), "/"));
});

module.exports = {
	'set_csp_host': set_csp_host,
	'set_cspro': set_cspro,
}
