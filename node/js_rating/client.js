const http = require('http')
const https = require('https')
const crypto = require('crypto')

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
		},
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
		if (err.code === 'ECONNRESET'){
			detect_obfuscation(js, maybeCallback)
		} else {
			maybeCallback(null, err)
		}
	});

	req.write(js)
	req.end()
}

function fetchJs(jsuri, callback){
	var options = {
		secureOptions: crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
	};
	var req = https.request(jsuri, options, (res) => {
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
		if (js.length == 0){
			collect('eval', {'obfuscated': 'empty'})
			return
		}
		var sha = "'sha256-" + crypto.createHash('sha256').update(js).digest('base64') + "'";
		detect_obfuscation(js, (message, error) => {
			if (error){
				collect('eval', {'error': error, 'error_msg': 'Failed to connect to evaluator', hash: sha});
				return
			}
			message['hash'] = sha
			collect('eval', message);
		})
	});
	
	fetchHost(jsuri, (hosts) => {
		collect('hosts', hosts);
	});
}

module.exports = {
	evaluate: evaluateJs,
}
