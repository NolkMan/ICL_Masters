const mitm = require('./mitmprox_setup/server.js')
const serv = require('./server/server.js')

var basic_cspro = "default-src 'none'; report-uri https://reporting.project:4333";
var current_host = 'www.westlondonmotorcycletraining.com';



mitm.set_cspro(basic_cspro)
mitm.set_csp_host(current_host)

//const client = require('./client/client.js')


