const express = require('express');
const bodyParser = require('body-parser');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');


const app = express(); // ✅ this was missing!
app.use(bodyParser.json());


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Amazon AU Login Attempt:", email);

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath || '/usr/bin/chromium-browser',
      headless: chromium.headless,
    });
    

    const page = await browser.newPage();
    await page.goto('https://flex.amazon.com.au/', { waitUntil: 'networkidle2' });

    // Click "Sign in" (Amazon AU uses a button or link here)
    const signInButton = await page.$('a[href*="signin"]');
    if (signInButton) {
      await signInButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    const currentUrl = page.url();
    if (!currentUrl.includes('ap/signin')) {
      throw new Error('Failed to navigate to signin page');
    }

    await page.type('#ap_email', email);
    await page.click('#continue');
    await page.waitForSelector('#ap_password', { timeout: 5000 });

    await page.type('#ap_password', password);
    await page.click('#signInSubmit');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const finalUrl = page.url();
    console.log("🧭 Final URL:", finalUrl);

    const loginSuccess = finalUrl.includes('flex.amazon.com.au');
    await browser.close();

    if (loginSuccess) {
      return res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      return res.status(401).json({ success: false, message: 'Login failed or additional verification required' });
    }
  } catch (error) {
    console.log("❌ Error during login:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

