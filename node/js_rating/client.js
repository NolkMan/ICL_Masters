const http = require('http')
const https = require('https')

var host = "localhost"
var port = 39645


function detect_obfuscation(js, callback){
	var cused = false
	var maybeCallback = (m, e) => {
		if (!cused){
			cused = true
			callback(m, e)
		}
	}
	var options = {
		hostname: host,
		port: port,
		path: '/',
		method: 'POST',
		headers: {
			'Content-Type': 'text/javascript',
			'Content-Length': Buffer.byteLength(js),
		}
	}
	var req = http.request(options);

	req.on('response', (res) => {
		var body = ''
		res.on('data', (data) => {
			body += data;
		});
		res.on('end', () => {
			try {
				var message = JSON.parse(body)
				maybeCallback(message, false);
			} catch (error) {
				maybeCallback(null,  error);
			}
		});
		res.on('error', (err) => {
			maybeCallback(null, err)
		});
	});

	req.on('error', (err) => {
		maybeCallback(null, err)
	});

	req.write(js)
	req.end()
}

function fetchJs(jsuri, callback){
	var req = https.request(jsuri, (res) => {
		var js = ''
		res.on('data', (part) => {
			js += part
		});
		res.on('end', () => {
			callback(js)
		});
	});
}

function evaluateJs(jsuri, callback){
	fetchJs(jsuri, (js) => {
		if (js == null){
			callback(null)
		}
		detect_obfuscation(js, (message, error) => {
			// TODO pass the message, ask the NC db, synchronize
		})
	});
}

module.exports = {
	evaluate: evaluateJs,
}
