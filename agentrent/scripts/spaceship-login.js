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
    // Try the main page first
    console.log('Going to Spaceship homepage...');
    await page.goto('https://www.spaceship.com/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Title:', await page.title());
    await page.screenshot({ path: '/tmp/ss-1-home.png', fullPage: false });
    
    // Look for login/signin link
    const loginLink = await page.$('a[href*="login"], a[href*="signin"], a:contains("Log in"), a:contains("Sign in")');
    
    // Get all links
    const links = await page.$$eval('a', as => as.map(a => ({ text: a.innerText.trim(), href: a.href })).filter(l => l.text.toLowerCase().includes('log') || l.text.toLowerCase().includes('sign') || l.href.includes('login')));
    console.log('Login-related links:', JSON.stringify(links.slice(0, 5)));
    
    // Try clicking "Log in" button if visible
    try {
      await page.click('a[href*="auth"], button:has-text("Log in"), a:has-text("Log in")');
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      // Try finding by text
      const buttons = await page.$$('a, button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text && text.toLowerCase().includes('log in')) {
          console.log('Found login button, clicking...');
          await btn.click();
          await new Promise(r => setTimeout(r, 3000));
          break;
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/ss-2-after-click.png', fullPage: false });
    console.log('After click - URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check for auth0 or similar login
    if (page.url().includes('auth') || page.url().includes('login')) {
      console.log('On login page!');
      
      // Wait for form
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/ss-3-login-form.png', fullPage: false });
      
      // Find email input
      const emailSel = 'input[type="email"], input[name="email"], input[name="username"], input[id*="email"], input[id*="username"]';
      await page.waitForSelector(emailSel, { timeout: 10000 }).catch(() => null);
      
      const emailInput = await page.$(emailSel);
      if (emailInput) {
        console.log('Typing email...');
        await emailInput.click();
        await emailInput.type('admin@aiagentrentals.io', { delay: 30 });
        
        const passInput = await page.$('input[type="password"]');
        if (passInput) {
          console.log('Typing password...');
          await passInput.click();
          await passInput.type('jkSrgx9U7sMRKV@', { delay: 30 });
          
          await page.screenshot({ path: '/tmp/ss-4-filled.png' });
          
          // Submit
          const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Continue")');
          if (submitBtn) {
            await submitBtn.click();
          } else {
            await page.keyboard.press('Enter');
          }
          
          await new Promise(r => setTimeout(r, 5000));
          await page.screenshot({ path: '/tmp/ss-5-after-submit.png' });
          console.log('After submit - URL:', page.url());
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/ss-error.png' });
  } finally {
    await browser.close();
  }
}

loginSpaceship();
