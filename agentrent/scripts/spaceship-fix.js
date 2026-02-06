const puppeteer = require('puppeteer');

async function fixSpaceship() {
  console.log('Starting headless browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Go to Spaceship login
    console.log('Going to Spaceship...');
    await page.goto('https://www.spaceship.com/login', { waitUntil: 'networkidle2' });
    
    // Take screenshot to see what we're working with
    await page.screenshot({ path: '/tmp/spaceship-1-login.png' });
    console.log('Screenshot saved: /tmp/spaceship-1-login.png');
    
    // Get page content to understand the form
    const html = await page.content();
    console.log('Page title:', await page.title());
    
    // Look for login form
    const emailInput = await page.$('input[type="email"], input[name="email"], input[id*="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      console.log('Found login form, attempting login...');
      
      // Try with the email credentials
      await emailInput.type('admin@aiagentrentals.io');
      await passwordInput.type('jkSrgx9U7sMRKV@');
      
      await page.screenshot({ path: '/tmp/spaceship-2-filled.png' });
      
      // Find and click submit button
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      }
      
      await page.screenshot({ path: '/tmp/spaceship-3-after-login.png' });
      console.log('After login screenshot saved');
      console.log('Current URL:', page.url());
      
    } else {
      console.log('Could not find login form elements');
      console.log('Looking for other elements...');
      const inputs = await page.$$('input');
      console.log('Found', inputs.length, 'input elements');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/spaceship-error.png' });
  } finally {
    await browser.close();
  }
}

fixSpaceship();
