const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function fixSpaceship() {
  console.log('Starting stealth browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    console.log('Going to Spaceship...');
    await page.goto('https://www.spaceship.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait a bit for Cloudflare
    await new Promise(r => setTimeout(r, 5000));
    
    await page.screenshot({ path: '/tmp/spaceship-stealth-1.png' });
    console.log('Page title:', await page.title());
    console.log('URL:', page.url());
    
    // Check if we're past Cloudflare
    const title = await page.title();
    if (title.includes('moment') || title.includes('Cloudflare')) {
      console.log('Still on Cloudflare, waiting longer...');
      await new Promise(r => setTimeout(r, 10000));
      await page.screenshot({ path: '/tmp/spaceship-stealth-2.png' });
      console.log('After wait - title:', await page.title());
    }
    
    // Try to find login form
    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    if (emailInput) {
      console.log('Found login form!');
      await emailInput.type('admin@aiagentrentals.io', { delay: 50 });
      
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type('jkSrgx9U7sMRKV@', { delay: 50 });
      }
      
      await page.screenshot({ path: '/tmp/spaceship-stealth-3.png' });
      
      // Submit
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 5000));
      
      await page.screenshot({ path: '/tmp/spaceship-stealth-4.png' });
      console.log('After login - URL:', page.url());
    } else {
      console.log('No login form found');
      const html = await page.content();
      console.log('Page content preview:', html.substring(0, 500));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/spaceship-error.png' });
  } finally {
    await browser.close();
  }
}

fixSpaceship();
