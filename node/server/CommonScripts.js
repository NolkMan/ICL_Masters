const scripts = {
	'googlesyndication.com': '*.googlesyndication.com',
	'analytics.google.com': '*.analytics.google.com',
	'g.doubleclick.net': '*.g.doubleclick.net',
	'www.googletagmanager.com': '*.googletagmanager.com',
	'partner.googleadservices.com': '*.googleadservices.com'
};

function hasScript(string){
	if (!string) return false;
	for (var k of Object.keys(scripts)){
		if (string.includes(k)){
			return scripts[k]
		}
	}
	return false
}

module.exports = {
	has: hasScript,
};
