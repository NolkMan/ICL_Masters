const EventEmitter = require('events');

const https = require('https');
const crypto = require('crypto')
const fs    = require('fs');

const url   = require('url');

const utils = require(__dirname + '/ServerUtils.js');
const term  = require(__dirname + '/ServerTUI.js');
const psql	= require(__dirname + '/ServerPSQL.js');
const common= require(__dirname + '/CommonScripts.js');

const server_options = {
	key: fs.readFileSync(__dirname + '/ssl/reporting.project-key.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/reporting.project.pem'),
}

const timeMatters = false

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

const ALPHA = 1

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
			if (res.rowCount > 0 && res.rows[0].evaluation){
				var timeAdded = Date.parse(res.rows[0].time)
				if ((!timeMatters) || timeAdded + 1000*60*60 > Date.now()){
					callback(res.rows[0].evaluation)
					return;
				}
			} 
			this.evaluator.evaluate(jsuri, (evaluation) => {
				psql.logEvaluation(this.host, jsuri, evaluation);
				callback(evaluation)
			})
		});
	}

	getInlineJsEvaluation(jsuri, callback){
		psql.getEvaluation(this.host, jsuri, (res) => {
			if (res.rowCount > 0 && res.rows[0].evaluation){
				var timeAdded = Date.parse(res.rows[0].time)
				if ((!timeMatters) || timeAdded + 1000*60*60 > Date.now()){
					callback(res.rows[0].evaluation)
					return;
				}
			}
			var colon = jsuri.indexOf(':')
			this.evaluator.evaluateInline(jsuri.slice(colon+1), Number(jsuri.slice(0, colon)), (evaluation) => {
				psql.logEvaluation(this.host, jsuri, evaluation);
				callback(evaluation)
			})
		});
	}

	maybeAddToCsp(report, uriCount, hostCount){
		var effectiveDir = report['effective-directive'];
		var blockedHost = url.parse(report['blocked-uri']).hostname; // null when inline
		if (['script-src', 'style-src'].includes(effectiveDir)){
			return false; // ignore reports from older browsers
		} else if ('script-src-attr' === effectiveDir){
			if (report['script-sample'].length < 40){
				this.emit('warning', report)
				var hash = "'sha256-" + crypto.createHash('sha256').update(report['script-sample']).digest('base64') + "'";
				return [effectiveDir, hash, 1000*60*4]
			} else {
				this.emit('violation', report)
				return false;
			}
		} else if ('script-src-elem' === effectiveDir){
			var rule
			if ((rule = common.has(blockedHost))){
				return [effectiveDir, rule];
			}
		} else if (['connect-src', 'font-src', 'img-src', 'media-src', 'style-src-attr', 'style-src-elem'].includes(effectiveDir)){
			if (blockedHost === this.host){
				return [effectiveDir, "'self'"]
			}
			if (blockedHost){
				return [effectiveDir, blockedHost]
			}
		} else if (effectiveDir === 'frame-src'){
			this.emit('warning', report)
			return [effectiveDir, blockedHost]
		} else if (effectiveDir ===  'frame-ancestors'){
			this.emit('violation', report)
		}
		return false;
	}

	addScriptToCspro(evaluation) {
		const min = 1000*60;
		if (!evaluation.eval.hash)
			return;
		if (evaluation.eval.obfuscated) {
			this.csproData['script-src-elem'][evaluation.eval.hash] = Date.now() + 8*min;
		} else {
			this.csproData['script-src-elem'][evaluation.eval.hash] = Date.now() + 30*min;
		}
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
				this.addScriptToCspro(evaluation);
				this.emit('cspro-change')
				if (evaluation.eval.obfuscated) {
					this.emit('violation', report, evaluation)
					return;
				}
			});
		}
		if (directive == 'script-src-elem' && blockedUri === 'inline'){
			var source = report['source-file']
			var line   = report['line-number']
			this.getInlineJsEvaluation(String(line) + ':' + source, (evaluation) => {
				this.addScriptToCspro(evaluation);
				this.emit('cspro-change')
				if (evaluation.eval.obfuscated) {
					this.emit('violation', report, evaluation)
					return;
				}
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
			var timeout = (toAdd.length >= 3 ? Date.now() + toAdd[3] : -1);
			this.csproData[toAdd[0]] ||= {}
			if (!(toAdd[1] in this.csproData[toAdd[0]])){
				this.csproData[toAdd[0]][toAdd[1]] = timeout;
				this.emit('cspro-change')
			}
		}
	}

	receiveReport(report){
		if (this.host === url.parse(report['document-uri']).hostname){
			psql.logReport(this.host, report)
			this.parseReport(report)
		}
	}

	cleanup_cspro(){
		const curtime = Date.now()
		for (const [dire, sources] of Object.entries(this.csproData)){
			var toclean = Object.entries(sources)
			var cleanedup = toclean.filter(([src, timeout]) => {
				return (timeout == -1 ? true : timeout > curtime)
			});
			this.csproData[dire] = Object.fromEntries(cleanedup)
		}
		this.emit('cspro-change');
		setTimeout(() => {
			this.cleanup_cspro()
		}, 10000);
	}

	constructor(port, host, evaluator){
		super()
		this.host = url.parse(host).hostname
		this.port = port
		this.evaluator = evaluator
		this.csproData = {
			'default-src': {"'none'": -1},
			'upgrade-insecure-requests': {},
			//'require-trusted-types-for': {"'script'": -1},
			'script-src': {"'report-sample'": -1},
			'style-src': {"'report-sample'": -1},
			'script-src-elem': {"'report-sample'": -1, "'unsafe-inline'": -1, "'self'": -1, "'strict-dynamic'": -1},
			'script-src-attr': {"'report-sample'": -1, "'unsafe-hashes'": -1},
			'style-src-elem': {"'report-sample'": -1, "'unsafe-inline'": -1},
			'style-src-attr': {"'report-sample'": -1, "'unsafe-inline'": -1, "'unsafe-hashes'": -1},
		}
		this.csproData['script-src-elem']['https://' + this.host] = -1;
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

	repeatAllReports(callback){
		psql.getAllReports(this.host, (res) => {
			for (const row of res.rows){
				if (row.report) {
					if (url.parse(row.report['document-uri']).hostname === this.host){
						this.parseReport(row.report)
					}
				} 
			}
			callback()
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
		this.cleanup_cspro()
	}

	getCspro(){
		var cspro = ''
		for (var dir in this.csproData){
			if (dir === 'upgrade-insecure-requests'){
				cspro = cspro + dir + '; '
			} else {
				cspro = cspro + dir + ' '
				for (const src of Object.keys(this.csproData[dir])){
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

function createServer(port, host, js_evaluator){
	return new CsproServer(port, host, js_evaluator)
}
module.exports = {
	'createServer': createServer
}
