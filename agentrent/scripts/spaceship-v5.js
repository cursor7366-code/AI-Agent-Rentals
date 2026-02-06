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
    
    // Click user icon in top right (should be near coordinates 1385, 30)
    console.log('Clicking user icon...');
    await page.mouse.click(1385, 30);
    await new Promise(r => setTimeout(r, 3000));
    
    await page.screenshot({ path: '/tmp/ss5-1-after-click.png' });
    console.log('After click URL:', page.url());
    
    // If we're on a login page, try to find inputs
    const emailInput = await page.$('input[type="email"], input[name="email"], input[name="username"], input[id="username"]');
    if (emailInput) {
      console.log('Found email input, filling...');
      await emailInput.type('admin@aiagentrentals.io', { delay: 30 });
      await page.screenshot({ path: '/tmp/ss5-2-email.png' });
      
      // Click continue/submit if multi-step
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await new Promise(r => setTimeout(r, 3000));
      }
      
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        console.log('Found password input, filling...');
        await passInput.type('jkSrgx9U7sMRKV@', { delay: 30 });
        await page.screenshot({ path: '/tmp/ss5-3-pass.png' });
        
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 8000));
        
        await page.screenshot({ path: '/tmp/ss5-4-loggedin.png' });
        console.log('After login URL:', page.url());
        console.log('Title:', await page.title());
        
        // If logged in, navigate to domain settings
        if (page.url().includes('launchpad') || page.url().includes('dashboard')) {
          console.log('Logged in! Navigating to domains...');
          await page.goto('https://www.spaceship.com/launchpad/domains/', { waitUntil: 'networkidle2' });
          await new Promise(r => setTimeout(r, 3000));
          await page.screenshot({ path: '/tmp/ss5-5-domains.png' });
          
          // Click on aiagentrentals.io
          await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const domainLink = links.find(l => l.innerText.includes('aiagentrentals.io') || l.href.includes('aiagentrentals.io'));
            if (domainLink) domainLink.click();
          });
          await new Promise(r => setTimeout(r, 3000));
          await page.screenshot({ path: '/tmp/ss5-6-domain-detail.png' });
          console.log('Domain page URL:', page.url());
        }
      }
    } else {
      console.log('No email input found after click');
      const allInputs = await page.$$eval('input', els => els.map(e => ({ type: e.type, name: e.name, id: e.id })));
      console.log('Inputs:', JSON.stringify(allInputs));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/ss5-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

loginSpaceship();
