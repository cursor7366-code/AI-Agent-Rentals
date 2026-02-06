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
    // Go directly to auth page
    console.log('Going to Spaceship auth...');
    await page.goto('https://auth.spaceship.com/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Title:', await page.title());
    console.log('URL:', page.url());
    await page.screenshot({ path: '/tmp/ss3-1.png' });
    
    // Try typing into email field
    const emailInput = await page.$('input[type="email"], input[name="email"], input[name="username"]');
    if (emailInput) {
      console.log('Found email input');
      await emailInput.type('admin@aiagentrentals.io', { delay: 30 });
      
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        console.log('Found password input');
        await passInput.type('jkSrgx9U7sMRKV@', { delay: 30 });
        await page.screenshot({ path: '/tmp/ss3-2-filled.png' });
        
        // Submit
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 8000));
        
        await page.screenshot({ path: '/tmp/ss3-3-after.png' });
        console.log('After login - URL:', page.url());
        console.log('Title:', await page.title());
      }
    } else {
      console.log('No email input found, checking page...');
      // Get all inputs
      const inputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id })));
      console.log('Inputs found:', JSON.stringify(inputs));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

loginSpaceship();
