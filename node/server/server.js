const EventEmitter = require('events');

const https = require('https');
const fs    = require('fs');

const url   = require('url');

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
	{
		"csp-report":{
			"document-uri":"https://www.westlondonmotorcycletraining.com/terms/",
			"referrer":"https://www.westlondonmotorcycletraining.com/booking/",
			"violated-directive":"style-src-elem", 
			"effective-directive":"style-src-elem", 
			"original-policy":"default-src 'none'; report-uri https://reporting.project:4333", 
			"disposition":"report", 
			"blocked-uri":"https://www.westlondonmotorcycletraining.com/css/bootstrap.min.css", 
			"line-number":11, 
			"source-file":"https://www.westlondonmotorcycletraining.com/terms/", 
			"status-code":200, 
			"script-sample":""
		}
	}
*/

const ALPHA = 100


class CsproServer extends EventEmitter {
	maybeAddToCsp(report, count){
		var effectiveDir = report['effective-directive'];
		var blockedHost = url.parse(report['blocked-uri']).hostname;
		if (['script-src', 'style-src'].includes(effectiveDir)){
			return false; // ignore reports from older browsers
		} else if (['script-src-elem','script-src-attr','style-src-elem','style-src-attr'].includes(effectiveDir)){
			// TODO: hard choice
		} else if (['font-src', 'img-src'].includes(effectiveDir)){
			if (blockedHost === this.host){
				return [effectiveDir, "'self'"]
			}
			if (count > ALPHA){
				return [effectiveDir, blockedHost]
			}
		}
			/*
	'child-src',
	'connect-src',
	'default-src',
	'frame-src',
	'manifest-src',
	'media-src',
	'object-src',
	'worker-src',
	'base-uri',
	'sandbox',
	'form-action',
	'frame-ancestors',
	'navigate-to',
	'require-trusted-types-for',
	'trusted-types',
	'upgrade-insecure-requests'
			*/
		return false;
	}

	constructor(port, host){
		super()
		this.host = host
		this.port = port
		this.reports = []
		this.csproData = {
			'default-src': ["'none'"],
			'upgrade-insecure-requests': [],
			'require-trusted-types-for': ['script'],
		}
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
				if (this.violators[report['effective-directive']][report['blocked-uri']]) {
					this.violators[report['effective-directive']][report['blocked-uri']] += 1
				} else {
					this.violators[report['effective-directive']][report['blocked-uri']] = 1
				}

				var toAdd = this.maybeAddToCsp(report, this.violators[report['effective-directive']][report['blocked-uri']])
				if (toAdd) {
					if (this.csproData[toAdd[0]]){
						this.csproData[toAdd[0]].push(toAdd[1])
					} else {
						this.csproData[toAdd[0]] = [toAdd[1]]
					}
				}

				res.statusCode = 204;
				res.end()
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

	getCspro(){
		var cspro = ''
		for (var dir in this.csproData){
			if (dir === 'upgrade-insecure-requests'){
				cspro = cspro + dir + '; '
			} else {
				cspro = cspro + dir + ' '
				for (const src of this.csproData[dir]){
					cspro = cspro + src + ' '
				}
				cspro = cspro + '; '
			}
		}
	}
}

function createServer(port, for_host){
	return new CsproServer(port, for_host)
}
module.exports = {
	'createServer': createServer
}
