const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function fixDNS() {
  console.log('Starting browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    console.log('Going to Spaceship login...');
    await page.goto('https://www.spaceship.com/auth/?returnUrl=%2Flaunchpad%2F', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Fill username
    const usernameInput = await page.$('input[name="username"], input[id="username"]');
    if (usernameInput) {
      await usernameInput.type('Hollywood7366', { delay: 30 });
    }
    
    // Fill password
    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.type('S6dEfVJi9n5fTb$', { delay: 30 });
    }
    
    await page.screenshot({ path: '/tmp/go-1-filled.png' });
    
    // Click login
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 8000));
    
    await page.screenshot({ path: '/tmp/go-2-after-login.png' });
    console.log('URL after login:', page.url());
    
    // Check if logged in
    if (page.url().includes('launchpad') && !page.url().includes('auth')) {
      console.log('✅ LOGGED IN!');
      
      // Go to domains
      console.log('Navigating to domains...');
      await page.goto('https://www.spaceship.com/launchpad/domains/', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: '/tmp/go-3-domains.png' });
      
      // Find and click aiagentrentals.io
      console.log('Looking for aiagentrentals.io...');
      const clicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, button, div, span'));
        for (const el of elements) {
          if (el.innerText && el.innerText.includes('aiagentrentals.io')) {
            el.click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log('Clicked on domain');
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: '/tmp/go-4-domain.png' });
        console.log('Domain page URL:', page.url());
        
        // Look for DNS or hosting settings
        const menuItems = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a, button')).map(el => el.innerText.trim()).filter(t => t.length > 0 && t.length < 50);
        });
        console.log('Menu items:', menuItems.slice(0, 20));
        
        // Try to find Web Hosting or DNS
        const clickedHosting = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('a, button, div'));
          for (const el of els) {
            const text = el.innerText?.toLowerCase() || '';
            if (text.includes('web hosting') || text.includes('dns') || text.includes('hosting')) {
              el.click();
              return el.innerText;
            }
          }
          return null;
        });
        
        if (clickedHosting) {
          console.log('Clicked:', clickedHosting);
          await new Promise(r => setTimeout(r, 3000));
          await page.screenshot({ path: '/tmp/go-5-hosting.png' });
        }
      }
      
    } else {
      console.log('❌ Login failed');
      const error = await page.evaluate(() => {
        const el = document.querySelector('[class*="error"], [role="alert"]');
        return el ? el.innerText : 'Unknown error';
      });
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/go-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

fixDNS();
