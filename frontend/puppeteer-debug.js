const puppeteer = require('puppeteer');
(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    } else if (msg.type() === 'warning') {
      console.log('BROWSER WARN:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER EXCEPTION:', err.toString());
  });

  console.log("Navigating to http://127.0.0.1:5000...");
  await page.goto('http://127.0.0.1:5000', { waitUntil: 'networkidle0' });
  
  console.log("Clicking #planetViewTrigger...");
  await page.click('#planetViewTrigger');
  
  console.log("Waiting 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
  console.log("Done");
})();
