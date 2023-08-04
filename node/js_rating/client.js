const http = require('http')
const https = require('https')

const url = require('url')
const net = require('net')
const dns = require('dns')

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
				//var message = JSON.parse(body)
				maybeCallback(body, false);
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
		res.on('error', (err) => {
			callback(null, err)
		});
	});
	req.on('error', (err) => {
		callback(null, err)
	});
	req.end()
}

function fetchHost(jsuri, callback){
	var host = url.parse(jsuri).host
	if (net.isIP(host)){
		dns.reverse(host, (err, addrs) => {
			if (!err){ 
				callback([host, jsuri].concat(addrs))
			} else {
				callback([host, jsuri])
			}
		});
	} else {
		callback([host, jsuri])
	}
}

function getCollector(toCollect, callback){
	var collected = {}
	return (what, data) => {
		collected[what] = data;
		for (const c of toCollect){
			if (!(c in collected)){
				return
			}
		}
		callback(collected);
	};
}

function evaluateJs(jsuri, callback){
	var collect = getCollector(['eval', 'hosts'], callback);
	fetchJs(jsuri, (js, err) => {
		if (err){
			collect('eval', {'error': err, 'error_msg': 'Failed to download script'});
			return;
		}
		detect_obfuscation(js, (message, error) => {
			if (error){
				collect('eval', {'error': error, 'error_msg': 'Failed to connect to evaluator'});
				return
			}
			collect('eval', {'message': message});
		})
	});
	
	fetchHost(jsuri, (hosts) => {
		collect('hosts', hosts);
	});
}

module.exports = {
	evaluate: evaluateJs,
}
