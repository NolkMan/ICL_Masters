const EventEmitter = require('events');

const https = require('https');
const fs    = require('fs');

const url   = require('url');

const utils = require(__dirname + '/ServerUtils.js');
const term  = require(__dirname + '/ServerTUI.js');
const psql	= require(__dirname + '/ServerPSQL.js');

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


/* violators: Map()
*	directive
*	Map() - violating hostnames
*		hostname
*		Map() - full urls under that hostname
*			url
*			[] array of reports for specific url
*/

const ALPHA = 100

function isJsReport(report) {
	var effectiveDir = report['effective-directive'];
	if (['script-src', 
		'script-src-elem',
		'script-src-attr',
		].includes(effectiveDir)){
		return true;
	}
	return false;
}

class CsproServer extends EventEmitter {
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
	getJsEvaluation(jsuri, callback){
		psql.getEvaluation(this.host, jsuri, (res) => {
			console.log(res.rows)
			if (res.rowCount > 0 && res.rows[0].evaluation){
				callback(res.rows[0].evaluation)
			} else {
				this.evaluator.evaluate(jsuri, (evaluation) => {
					psql.logEvaluation(this.host, jsuri, evaluation);
					callback(evaluation)
				})
			}
		});
	}

	maybeAddToCsp(report, uriCount, hostCount){
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
			if (uriCount > ALPHA){
				return [effectiveDir, blockedHost]
			}
		}
		return false;
	}

	parseReport(report){
		var directive = report['effective-directive']
		var blockedUri = report['blocked-uri']
		var blockedHost = url.parse(blockedUri).hostname

		if (this.malUrls.has(blockedHost)){
			if (!this.malicious.has(blockedHost)){
				console.log('Malicious host: ' + blockedHost)
				this.malicious.set(blockedHost, true)
			}
		}

		if (directive == 'script-src-elem' && blockedUri !== 'inline'){
			this.getJsEvaluation(blockedUri, (evaluation) => {
				console.log((evaluation.eval.obfuscated ? "XXX  " : "     ") + evaluation.hosts[0] 
					+ "  " + evaluation.hosts[1]);
			});
		}

		if (!this.violators.get(directive).has(blockedHost))
			this.violators.get(directive).set(blockedHost, new Map())
		if (!this.violators.get(directive).get(blockedHost).has(blockedUri))
			this.violators.get(directive).get(blockedHost).set(blockedUri, [])
		this.violators.get(directive).get(blockedHost).get(blockedUri).push(report)

		var hostCount = this.violators.get(directive).get(blockedHost).length
		var  uriCount = this.violators.get(directive).get(blockedHost).get(blockedUri).length

		var toAdd = this.maybeAddToCsp(report, uriCount, hostCount)
		if (toAdd) {
			this.csproData[toAdd[0]] ||= []
			if (!this.csproData[toAdd[0]].includes(toAdd[1])){
				this.csproData[toAdd[0]].push(toAdd[1])
			}
		}
	}

	receiveReport(report){
		if (this.host === url.parse(report['document-uri']).hostname){
			psql.logReport(this.host, report)
			this.parseReport(report)
		}
	}

	constructor(port, host, evaluator){
		super()
		this.host = host
		this.port = port
		this.evaluator = evaluator
		this.csproData = {
			'default-src': ["'none'"],
			'upgrade-insecure-requests': [],
			'require-trusted-types-for': ["'script'"],
			'script-src': ["'report-sample'"],
			'style-src': ["'report-sample'"],
			'script-src-elem': ["'report-sample'"],
			'script-src-attr': ["'report-sample'", "'unsafe-hashes'"],
			'style-src-elem': ["'report-sample'"],
			'style-src-attr': ["'report-sample'", "'unsafe-hashes'"],
		}
		this.violators = new Map(
			utils.csp_directives.map(dir => [dir, new Map()])
		);

		this.server = https.createServer(server_options, (req, res) => {
			if (req.method != 'POST'){
				req.socket.destroy()
			}
			var body = ''
			req.on('data', (data) => {
				body += data;
			})
			req.on('end', () => {
				try {
					var report = JSON.parse(body)
					report = report['csp-report']
				} catch (error) {
					res.statusCode = 204;
					res.end()
					return;
				} 
				this.receiveReport(report)
				res.statusCode = 204;
				res.end()
			})
		});
	}

	repeatAllReports(){
		psql.getAllReports(this.host, (res) => {
			for (const row of res.rows){
				if (row.report) {
					if (url.parse(row.report['document-uri']).hostname === this.host){
						this.parseReport(row.report)
					} else {
						// report for the wrong host: ignore
					}
				} 
			}
		});
	}

	start(callback){
		this.malUrls = new Map(Array.from(new Set(utils.getMaliciousUrls())).map(x => [x, true]))
		this.malicious = new Map()
		psql.start(() => {
			this.server.listen(this.port, () => {
				console.log("Reporting server running at http://".concat('localhost', ":").concat(String(this.port), "/"));
				callback()
			});
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
		return (cspro + 'report-uri https://reporting.project:' + String(this.port))
	}

	useTerminal(){
		term.start(() => {
			return {
				violators: this.violators,
				csproData: this.csproData,
				cspro: this.getCspro()
			}
		});
	}

}

function createServer(port, for_host, js_evaluator){
	return new CsproServer(port, for_host, js_evaluator)
}
module.exports = {
	'createServer': createServer
}
