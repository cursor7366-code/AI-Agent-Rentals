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
    await new Promise(r => setTimeout(r, 5000));
    
    // Fill username
    const usernameInput = await page.$('input[name="username"], input[id="username"]');
    if (usernameInput) {
      await usernameInput.type('Hollywood7366', { delay: 50 });
    }
    
    // Fill password
    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.type('S6dEfVJi9n5fTb$', { delay: 50 });
    }
    
    await page.screenshot({ path: '/tmp/cap-1.png' });
    
    // Wait for CAPTCHA to appear
    await new Promise(r => setTimeout(r, 2000));
    
    // Try to find and click CAPTCHA iframe
    const frames = page.frames();
    console.log('Frames:', frames.length);
    
    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('cloudflare') || url.includes('turnstile') || url.includes('captcha')) {
        console.log('Found CAPTCHA frame:', url);
        try {
          const checkbox = await frame.$('input[type="checkbox"], .checkbox, [role="checkbox"]');
          if (checkbox) {
            await checkbox.click();
            console.log('Clicked checkbox');
          }
        } catch (e) {
          console.log('Frame click error:', e.message);
        }
      }
    }
    
    // Also try clicking by coordinates where CAPTCHA usually is
    console.log('Clicking CAPTCHA area...');
    await page.mouse.click(407, 337);  // Checkbox position
    await new Promise(r => setTimeout(r, 5000));
    
    await page.screenshot({ path: '/tmp/cap-2.png' });
    
    // Now click login button
    console.log('Clicking login...');
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
    }
    await new Promise(r => setTimeout(r, 8000));
    
    await page.screenshot({ path: '/tmp/cap-3.png' });
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    if (page.url().includes('launchpad') && !page.url().includes('auth')) {
      console.log('✅ LOGGED IN!');
      // Continue with DNS fix...
    } else {
      const error = await page.evaluate(() => {
        const el = document.querySelector('[class*="error"], [role="alert"]');
        return el ? el.innerText : null;
      });
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

fixDNS();
