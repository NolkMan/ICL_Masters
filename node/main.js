const mitm = require('./mitmprox_setup/server.js')
const serv = require('./server/server.js')

var basic_cspro = "default-src 'none'; report-uri https://reporting.project:4333";
var current_host = 'https://www.westlondonmotorcycletraining.com/courses/';



mitm.set_cspro(basic_cspro)
mitm.set_csp_endpoint(current_host)

const client = require('./client/client.js')


