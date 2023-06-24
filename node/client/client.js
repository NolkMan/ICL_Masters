
const puppeteer = require('puppeteer');


(async() => {
	const browser = await puppeteer.launch({
		headless: false,
	  args: [ '--proxy-server=127.0.0.1:8080' ]
	});
	const page = await browser.newPage();
	await page.goto('https://www.westlondonmotorcycletraining.com/courses/');
	  
	//await sleep(10);
	await browser.close();
})();
