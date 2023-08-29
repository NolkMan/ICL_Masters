const https = require('https')

function send_mock_cspro(port){
	const req = https.request({
			hostname: 'reporting.project',
			port: port,
			path: '/',
			method: 'POST',
		}, (res) => {
		});

	req.write('{"csp-report":{"document-uri":"https://www.westlondonmotorcycletraining.com/terms/","referrer":"https://www.westlondonmotorcycletraining.com/booking/","violated-directive":"style-src-elem","effective-directive":"style-src-elem","original-policy":"default-src \'none\'; report-uri https://reporting.project:4333","disposition":"report","blocked-uri":"https://www.westlondonmotorcycletraining.com/css/bootstrap.min.css","line-number":11,"source-file":"https://www.westlondonmotorcycletraining.com/terms/","status-code":200,"script-sample":""}}');

	req.end();
}

module.exports = {
	'send_mock_cspro': send_mock_cspro,
}
