const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginSpaceship() {
  console.log('Starting browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Go directly to launchpad
    console.log('Going to Launchpad...');
    await page.goto('https://www.spaceship.com/launchpad/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    await page.screenshot({ path: '/tmp/ss6-1-launchpad.png' });
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check if we're on login page
    const emailInput = await page.$('input[type="email"], input[name="email"], input[id="email"], input[name="username"], input[id="username"]');
    if (emailInput) {
      console.log('Found email input, filling...');
      await emailInput.click();
      await emailInput.type('admin@aiagentrentals.io', { delay: 50 });
      await page.screenshot({ path: '/tmp/ss6-2-email.png' });
      
      // Look for continue/next button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        console.log('Button:', text);
      }
      
      // Try clicking submit
      await page.click('button[type="submit"]').catch(() => page.keyboard.press('Enter'));
      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: '/tmp/ss6-3-afteremail.png' });
      
      // Now password
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        console.log('Found password, filling...');
        await passInput.click();
        await passInput.type('jkSrgx9U7sMRKV@', { delay: 50 });
        await page.screenshot({ path: '/tmp/ss6-4-pass.png' });
        
        await page.click('button[type="submit"]').catch(() => page.keyboard.press('Enter'));
        await new Promise(r => setTimeout(r, 8000));
        await page.screenshot({ path: '/tmp/ss6-5-loggedin.png' });
        console.log('After login URL:', page.url());
        console.log('Title:', await page.title());
      }
    } else {
      console.log('No email input. Looking at page...');
      const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id, placeholder: e.placeholder })));
      console.log('Inputs found:', JSON.stringify(inputs));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/ss6-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

loginSpaceship();
