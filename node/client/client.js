const puppeteer = require('puppeteer');
const fs = require('fs');

const url = require('url');


function browse(host){
	var hostname = url.parse(host).hostname
	var screenshotPath = 'screenshots/' + hostname.replace(/\./g, '_');
	console.log('screenshots will be in: ' + screenshotPath);

	fs.mkdirSync(screenshotPath, {recursive: true})

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
			defaultViewport: {
				width: 1920,
				height: 947,
			},
			args: [ '--proxy-server=127.0.0.1:8080',
					//'--disable-setuid-sandbox',
					//'--no-sandbox',
			]
		});
		const page = await browser.newPage();
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0');
		await page.goto(host);
		  
		await new Promise(r => setTimeout(r, 4000));

		const consent = page.frames().find(f => f.url().includes('consent'));
		const [button] = await consent.$x("//button[contains(., 'I Agree')]");
		if (button) {
			await button.click()
		}

		await new Promise(r => setTimeout(r, 1000));

		const hrefs = await page.$$eval('a', as => as.map(a => a.href));
		const same_host_refs = [...hrefs.filter(isSameHost)];
		if (same_host_refs.includes(host)){
			same_host_refs.splice(same_host_refs.indexOf(host), 1);
		}

		try {
			page.screenshot({path: screenshotPath + '/index.png'});
		} catch (e) {
			console.log('Failed saving "' + host + '" to path' + screenshotPath + '/index.png');
			console.log(e)
		}

		var chosenRefs = same_host_refs.sort(() => 0.5 - Math.random()).slice(0,5);
		console.log(chosenRefs)

		const func = async(ref) => {
			// sometimes thay may stall but I do not care enough
			const rpage = await browser.newPage()
			await rpage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0');
			try {
				await rpage.goto(ref);
			} catch {
			}
			var pathname = url.parse(ref).pathname.replace(/\//g, '_')
			try {
				rpage.screenshot({path: screenshotPath + '/' + pathname + '.png'});
			} catch (e) {
				console.log('Failed saving "' + ref + '" to file ' + screenshotPath + '/' + pathname + '.png');
				console.log(e)
			}
		};

		var promises = []
		for (var r of chosenRefs){
			promises.push(func(r))
		}

		for (var p of promises){
			await p;
		}

		await new Promise(r => setTimeout(r, 5000));
		await browser.close();
	})();
}

module.exports = {
	browse: browse,
}
