function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

const mitm = require('./mitmprox_setup/server.js')
const server = require('./server/server.js')
const js_evaluator = require('./js_rating/client.js')

const test = require('./utils/TestUtils.js')

var PICKED_HOSTS = [
	{good: true, top: 878 , host: 'https://codepen.io'},
	{good: true, top: 2589, host: 'https://www.pcworld.com'},
	{good: true, top: 2650, host: 'https://computingforgeeks.com'},
	{good: true, top: 3302, host: 'https://www.scribbr.com'},
	{good: true, top: 3397, host: 'https://cafe.naver.com'},
	{good: true, top: 4642, host: 'https://www.libertatea.ro'},
	{good: true, top: 5463, host: 'https://www.purolator.com'},
	{good: true, top: 5524, host: 'https://www.flashscore.es'},
	{good: true, top: 5686, host: 'https://quran.com'},
	{good: true, top: 7153, host: 'https://www.professormesser.com'},
]

var picked = PICKED_HOSTS[0];
var current_host = picked.host;

var port = getRandomInt(2000, 65500)
var basic_cspro = "default-src 'none'; report-uri https://reporting.project:" + String(port);

mitm.set_cspro(basic_cspro)
mitm.set_csp_host(current_host)

var serv = server.createServer(port, current_host, js_evaluator);
serv.start(() => {
	serv.repeatAllReports()
	//serv.useTerminal()
	mitm.set_cspro(serv.getCspro())
	//test.send_mock_cspro(4333);
});


//const client = require('./client/client.js')


