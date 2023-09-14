
const mitm = require('./mitmprox_setup/server.js')
const server = require('./server/server.js')
const js_evaluator = require('./js_rating/client.js')
const url = require('url')
const test = require('./utils/TestUtils.js')

const updateCspro = true;
const dryRun = false;
const preTrain = false; // use already existing reports to setup the policy maker
const runClient = false; // true to open Puppeteer
const longTest = true;
const pickNum = 11; // chose host from PICKED_HOSTS
const useTerminal = true; // enables terminal interface (may cause crashes)


var PICKED_HOSTS = [
	{good: true, top: 732 , host: 'https://www.caixabank.es'}, // custom picked bank without CSP that does not have ads 
	{good: true, top: 878 , host: 'https://codepen.io'}, // cloudflare doesnt even allow access
	{good: true, top: 2589, host: 'https://www.pcworld.com'}, // cloudflare sometimes blocks
	{good: true, top: 2650, host: 'https://computingforgeeks.com'}, // cloudflare blocks 
	{good: true, top: 3302, host: 'https://www.scribbr.com'}, // does not have cookie policy (has iframe that does not work)
	{good: true, top: 3397, host: 'https://cafe.naver.com'}, // japanese
	{good: true, top: 4642, host: 'https://www.libertatea.ro'}, // romanian
	{good: true, top: 5463, host: 'https://www.purolator.com'}, // doesnt care about cookies blocks on second view
	{good: true, top: 5524, host: 'https://www.flashscore.es'}, // spanish doesn't care about cookies enough
	{good: true, top: 5686, host: 'https://quran.com'}, // in hebrew, gives a lot of malicious script flags as they are sending raw binary data to decode in js files
	{good: true, top: 7153, host: 'https://www.professormesser.com'}, // no cookies

	{good:false, top: -1,	host: 'https://testing.site'}, // my own testing site
]

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function hostForMITM(uri){
	return url.parse(uri).hostname.split('.').slice(-2).join('.')
}

var picked = PICKED_HOSTS[pickNum];
var current_host = picked.host;

var port = getRandomInt(2000, 65500)
var basic_cspro = "default-src 'none'; report-uri https://reporting.project:" + String(port);

mitm.set_cspro(basic_cspro)
mitm.set_csp_host(hostForMITM(current_host))

var serv = server.createServer(port, current_host, js_evaluator);
serv.start(() => {
	mitm.set_cspro(serv.getCspro())
	
	if (dryRun) {
		serv.repeatAllReports(() => {})
		if (useTerminal){
			serv.useTerminal()
		}
	} else {
		var after = () => {
			if (runClient){
				const client = require('./client/client.js')
				if (longTest){
					client.longBrowse(current_host)
				} else {
					client.browse(current_host)
				}
			}
			if (useTerminal){
				serv.useTerminal()
			}
		}
		if (preTrain) {
			serv.repeatAllReports(() => {
				setTimeout(after, 3000);
			});
		} else {
			setTimeout(after, 3000);
		}
	}
});

if (updateCspro) {
	serv.on('cspro-change', () => {
		mitm.set_cspro(serv.getCspro())
		console.log('cspro-change');
	});
}

serv.on('violation', (report, evaluation) => {
	console.log('violation:   ' + report["effective-directive"] + '    ' + String(report['blocked-uri']) + '    Hash: ' + evaluation.eval.hash );
});

serv.on('warning', (report, evaluation) => {
	console.log('warning:     ' + report["effective-directive"] + '    ' + String(report['blocked-uri']));
});

serv.on('new', (uri, e) => {
	console.log('new:         ' + uri);
});
serv.on('changed', (uri, e) => {
	console.log('changed:     ' + uri);
});

var mitmLastPrint = Date.now()
mitm.get_emitter().on('mitm-request', (data) => {
	var now = Date.now()
	if (mitmLastPrint + 1000 < now){
		mitmLastPrint = now
		console.log('Total: ' + String(data['total-transfered']) + 'B' + '\t' +
			'Added: ' + String(data['additional-bytes']) + 'B' + '\t' + 
			'Fraction: ' + String(data['additional-bytes'] / (data['additional-bytes'] + data['total-transfered'])) + '\t' +
			'Now: ' + String(Date.now())
		);
	}
});
