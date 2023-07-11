const fs = require('fs')

const csp_directives = [
	'child-src',
	'connect-src',
	'default-src',
	'font-src',
	'frame-src',
	'img-src',
	'manifest-src',
	'media-src',
	'object-src',
	'script-src',
	'script-src-elem',
	'script-src-attr',
	'style-src',
	'style-src-elem',
	'style-src-attr',
	'worker-src',
	'base-uri',
	'sandbox',
	'form-action',
	'frame-ancestors',
	'navigate-to',
	'require-trusted-types-for',
	'trusted-types',
	'upgrade-insecure-requests'
]

const csp_source_directives = [
	'default-src',
	'child-src',
	'connect-src',
	'font-src',
	'frame-src',
	'img-src',
	'manifest-src',
	'media-src',
	'object-src',
	'prefetch-src',
	'script-src',
	'script-src-elem',
	'script-src-attr',
	'style-src',
	'style-src-elem',
	'style-src-attr',
	'worker-src',
	'base-uri',
	'navigate-to',
	'form-action',
]

function getMaliciousUrls(){
	var data = fs.readFileSync('../netcraft-data/malicious_js.json').toString().split("\n");
	var urls = []
	for (const line of data){
		try {
			var j = JSON.parse(line)
			if (j['hostname']){
				urls.push(j['hostname'])
			}
		} catch {
			// ignore
		}
	}
	return urls
}

module.exports = {
	'csp_directives': csp_directives,
	'csp_source_directives': csp_source_directives,
	getMaliciousUrls: getMaliciousUrls,
}
