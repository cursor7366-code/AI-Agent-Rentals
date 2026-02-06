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
  
  // Passwords to try
  const passwords = [
    'Cursor7366!?!',  // Twitter password (similar username style)
    'jkSrgx9U7sMRKV@',  // Email password
    'bL7$tD9#?uVdVG('  // Discord password
  ];
  
  try {
    console.log('Going to Launchpad...');
    await page.goto('https://www.spaceship.com/auth/?returnUrl=%2Flaunchpad%2F', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    
    for (const password of passwords) {
      console.log('Trying password:', password.substring(0, 3) + '***');
      
      // Clear and fill username
      const usernameInput = await page.$('input[name="username"], input[id="username"], input[type="text"]');
      if (usernameInput) {
        await usernameInput.click({ clickCount: 3 });
        await usernameInput.type('Hollywood7366', { delay: 30 });
      }
      
      // Clear and fill password
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        await passInput.click({ clickCount: 3 });
        await passInput.type(password, { delay: 30 });
      }
      
      // Click login button
      const loginBtn = await page.$('button[type="submit"]');
      if (loginBtn) {
        await loginBtn.click();
      }
      
      await new Promise(r => setTimeout(r, 5000));
      await page.screenshot({ path: `/tmp/ss-final-${passwords.indexOf(password)}.png` });
      
      // Check if login succeeded
      const url = page.url();
      console.log('After login URL:', url);
      
      if (url.includes('launchpad') && !url.includes('auth')) {
        console.log('LOGIN SUCCESS!');
        
        // Navigate to domains
        await page.goto('https://www.spaceship.com/launchpad/domains/', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 3000));
        await page.screenshot({ path: '/tmp/ss-domains.png' });
        console.log('On domains page');
        
        // Click on aiagentrentals.io
        const domainLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const link = links.find(l => l.innerText.includes('aiagentrentals.io') || l.href.includes('aiagentrentals.io'));
          if (link) {
            link.click();
            return true;
          }
          return false;
        });
        
        if (domainLink) {
          await new Promise(r => setTimeout(r, 3000));
          await page.screenshot({ path: '/tmp/ss-domain-detail.png' });
          console.log('Domain detail URL:', page.url());
          
          // Look for DNS or Web Hosting settings
          const dnsLink = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, button'));
            const link = links.find(l => 
              l.innerText.toLowerCase().includes('dns') || 
              l.innerText.toLowerCase().includes('hosting') ||
              l.innerText.toLowerCase().includes('web hosting')
            );
            if (link) {
              console.log('Found:', link.innerText);
              link.click();
              return link.innerText;
            }
            return null;
          });
          console.log('Clicked:', dnsLink);
          await new Promise(r => setTimeout(r, 3000));
          await page.screenshot({ path: '/tmp/ss-dns.png' });
        }
        
        break;
      }
      
      // Check for error message
      const errorMsg = await page.evaluate(() => {
        const error = document.querySelector('[class*="error"], [class*="alert"], [role="alert"]');
        return error ? error.innerText : null;
      });
      
      if (errorMsg) {
        console.log('Error:', errorMsg);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/ss-final-error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
}

loginSpaceship();
