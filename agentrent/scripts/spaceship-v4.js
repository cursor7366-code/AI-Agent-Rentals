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
    console.log('Going to Spaceship...');
    await page.goto('https://www.spaceship.com/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    await page.screenshot({ path: '/tmp/ss4-1-home.png' });
    console.log('Title:', await page.title());
    
    // Find all links and buttons with "log" or "sign" text
    const elements = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('a, button').forEach(el => {
        const text = el.innerText.toLowerCase();
        const href = el.href || '';
        if (text.includes('log') || text.includes('sign') || href.includes('log') || href.includes('sign') || href.includes('auth')) {
          results.push({ tag: el.tagName, text: el.innerText.trim().substring(0, 50), href: href.substring(0, 100) });
        }
      });
      return results;
    });
    
    console.log('Found elements:', JSON.stringify(elements, null, 2));
    
    // Look for "Log in" specifically
    const loginBtn = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('a, button'));
      for (const el of els) {
        if (el.innerText.trim().toLowerCase() === 'log in' || el.innerText.trim().toLowerCase() === 'login') {
          return { found: true, href: el.href, tag: el.tagName };
        }
      }
      return { found: false };
    });
    
    console.log('Login button:', JSON.stringify(loginBtn));
    
    if (loginBtn.found && loginBtn.href) {
      console.log('Navigating to login URL:', loginBtn.href);
      await page.goto(loginBtn.href, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      
      await page.screenshot({ path: '/tmp/ss4-2-login.png' });
      console.log('Login page URL:', page.url());
      console.log('Login page title:', await page.title());
      
      // Now try to fill the form
      const emailInput = await page.$('input[type="email"], input[name="email"], input[name="username"], input[id="username"]');
      if (emailInput) {
        console.log('Filling email...');
        await emailInput.type('admin@aiagentrentals.io', { delay: 30 });
        
        // Look for continue or next button (some logins are multi-step)
        await page.screenshot({ path: '/tmp/ss4-3-email.png' });
        
        const continueBtn = await page.$('button[type="submit"]');
        if (continueBtn) {
          await continueBtn.click();
          await new Promise(r => setTimeout(r, 3000));
        }
        
        // Now look for password
        const passInput = await page.$('input[type="password"]');
        if (passInput) {
          console.log('Filling password...');
          await passInput.type('jkSrgx9U7sMRKV@', { delay: 30 });
          await page.screenshot({ path: '/tmp/ss4-4-pass.png' });
          
          await page.keyboard.press('Enter');
          await new Promise(r => setTimeout(r, 8000));
          
          await page.screenshot({ path: '/tmp/ss4-5-done.png' });
          console.log('After login URL:', page.url());
        }
      } else {
        console.log('No email input found');
        const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id, placeholder: e.placeholder })));
        console.log('Available inputs:', JSON.stringify(inputs));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/ss4-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

loginSpaceship();
