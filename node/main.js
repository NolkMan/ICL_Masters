function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

const mitm = require('./mitmprox_setup/server.js')
const server = require('./server/server.js')
const js_evaluator = require('./js_rating/client.js')
const url = require('url')
const test = require('./utils/TestUtils.js')

var PICKED_HOSTS = [
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
]

const updateCspro = true;
const dryRun = false;
const preTrain = true;
const pickNum = 4;

var picked = PICKED_HOSTS[pickNum];
var current_host = picked.host;

var port = getRandomInt(2000, 65500)
var basic_cspro = "default-src 'none'; report-uri https://reporting.project:" + String(port);

mitm.set_cspro(basic_cspro)
mitm.set_csp_host(url.parse(current_host).hostname)

var serv = server.createServer(port, current_host, js_evaluator);
serv.start(() => {
	mitm.set_cspro(serv.getCspro())
	
	if (dryRun) {
		serv.repeatAllReports()
		serv.useTerminal()
	} else {
		if (preTrain) {
			serv.repeatAllReports(() => {
				setTimeout(() => {
					const client = require('./client/client.js')
					client.browse(current_host)
				}, 3000);
			});
		} else {
			setTimeout(() => {
				const client = require('./client/client.js')
				client.browse(current_host)
			}, 3000);
		}
	}
});

if (updateCspro) {
	serv.on('cspro-change', () => {
		mitm.set_cspro(serv.getCspro())
	});
}

serv.on('violation', (report, evaluation) => {
	console.log('violation:   ' + String(report['blocked-url']));
});

serv.on('warning', (report, evaluation) => {
	console.log('warning:     ' + String(report['blocked-url']));
});

var mitmLastPrint = Date.now()
mitm.get_emitter().on('mitm-request', (data) => {
	var now = Date.now()
	if (mitmLastPrint + 1000 < now){
		mitmLastPrint = now
		console.log('Total: ' + String(Math.round(data['total-transfered']/1000)) + 'kB' + 
			'Added: ' + String(Math.round(data['additional-bytes']/1000)) + 'kB' +
			'Percentage: ' + String(data['additional-bytes'] / (data['additional-bytes'] + data['total-transfered'])) + '%'
		);
		/*
		 * {
		 * 'url': flow.request.pretty_url, 
		 * 'additional-bytes': self.total_bytes_ott, 
		 * 'total-transfered': self.total_bytes_sent
		 * })
		 */
	}
});
