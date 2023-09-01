/*
 *	Code taken from https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
 *	and adapted by me
 * 
 */
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const port = parseInt(process.argv[2]) || 9000;

const serverOptions = {
	key: fs.readFileSync(__dirname + '/ssl/testing.site-key.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/testing.site.pem'),
}

const contentTypeMap = {
	'.ico': 'image/x-icon',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.wav': 'audio/wav',
	'.mp3': 'audio/mpeg',
	'.svg': 'image/svg+xml',
	'.pdf': 'application/pdf',
	'.doc': 'application/msword'
};

var malicious = false;

function requestHandler(req, res) {
	console.log(`${req.method} ${req.url}`);

	const parsedUrl = url.parse(req.url);
	let pathname = `.${parsedUrl.pathname}`;
	let ext = path.parse(pathname).ext;

	fs.exists(pathname, function (exist) {
		if(!exist) {
			res.statusCode = 404;
			res.end(`File ${pathname} not found!`);
			return;
		}

		// if is a directory search for index file matching the extension
		if (fs.statSync(pathname).isDirectory()) {
			pathname += '/index.html';
			ext = '.html';
		}

		if (malicious && pathname == './index.js'){
			pathname = './mal.js'
		}

		// read file from file system
		fs.readFile(pathname, function(err, data){
			if(err){
				res.statusCode = 500;
				res.end(`Error getting the file: ${err}.`);
			} else {
				// if the file is found, set Content-type and send data
				res.setHeader('Content-type', contentTypeMap[ext] || 'text/plain' );
				res.end(data);
			}
		});
	});
}

https.createServer(serverOptions, requestHandler).listen(port, () => {
	console.log(`Server listening on testing.site:${port}`);
	setTimeout(() => {
		malicious = true;
	}, 10000);
});

