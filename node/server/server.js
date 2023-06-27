const EventEmitter = require('events');

const https = require('https');
const fs    = require('fs');

const utils = require(__dirname + '/ServerUtils.js');
const term  = require(__dirname + '/ServerTUI.js');

const server_options = {
	key: fs.readFileSync(__dirname + '/ssl/reporting.project-key.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/reporting.project.pem'),
}

/*
{
  "csp-report": {
    "blocked-uri": "http://example.com/css/style.css",
    "disposition": "report",
    "document-uri": "http://example.com/signup.html",
    "effective-directive": "style-src-elem",
    "original-policy": "default-src 'none'; style-src cdn.example.com; report-to /_/csp-reports",
    "referrer": "",
    "status-code": 200,
    "violated-directive": "style-src-elem"
  }
}
*/

class CsproServer extends EventEmitter {
	constructor(port){
		super()
		this.port = port
		this.reports = []
		this.violators = Object.fromEntries(utils.csp_directives.map(dir => [dir, {}]))
		
		console.log(this.violators);

		this.server = https.createServer(server_options, (req, res) => {
			if (req.method != 'POST'){
				req.socket.destroy()
			}
			var body = ''
			req.on('data', (data) => {
				body += data;
			})
			req.on('end', () => {
				var report = JSON.parse(body)
				report = report['csp-report']
				this.reports.push(report)
				console.log(this.violators[report['effective-directive']]);
				console.log(report)
				this.violators[report['effective-directive']][report['blocked-uri']] = 0;
				res.statusCode = 200;
				res.end('OK')
			})
		});
	}

	start(){
		this.server.listen(this.port, () => {
			console.log("Reporting server running at http://".concat('localhost', ":").concat(String(this.port), "/"));
		});
	}

	useTerminal(){
		term.start(() => {
			return this.violators;
		});
	}
}

function createServer(port){
	return new CsproServer(port)
}
module.exports = {
	'createServer': createServer
}
