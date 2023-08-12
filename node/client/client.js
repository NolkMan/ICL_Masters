const puppeteer = require('puppeteer');

const url = require('url');


function browse(host){
	var hostname = url.parse(host).hostname
	var isSameHost = function (h){
		try{
			if (url.parse(h).hostname == hostname){
				return true;
			}
			return false
		} catch {
			return false
		}
		return false
	};

	(async() => {
		const browser = await puppeteer.launch({
			headless: false,
		  args: [ '--proxy-server=127.0.0.1:8080' ]
		});
		const page = await browser.newPage();
		await page.goto(host);
		  
		await new Promise(r => setTimeout(r, 10000));

		const hrefs = await page.$$eval('a', as => as.map(a => a.href));
		const same_host_refs = hrefs.filter(isSameHost)

		console.log(same_host_refs)

		await browser.close();
	})();
}

module.exports = {
	browse: browse,
}
