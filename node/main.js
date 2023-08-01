const mitm = require('./mitmprox_setup/server.js')
const server = require('./server/server.js')
const js_evaluator = require('./js_rating/client.js')

const test = require('./utils/TestUtils.js')

var basic_cspro = "default-src 'none'; report-uri https://reporting.project:4333";
var current_host = 'mabb16.angelfire.com';

mitm.set_cspro(basic_cspro)
mitm.set_csp_host(current_host)

var serv = server.createServer(4333, current_host, js_evaluator);
serv.start(() => {
	serv.repeatAllReports()
	//serv.useTerminal()
	mitm.set_cspro(serv.getCspro())
	//test.send_mock_cspro(4333);
});


//const client = require('./client/client.js')


