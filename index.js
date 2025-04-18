const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Amazon AU Login Attempt:", email);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://flex.amazon.com.au/', { waitUntil: 'networkidle2' });

    // Click "Sign in" if visible
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
    if (browser) await browser.close();

    return res.status(200).json({
      success: loginSuccess,
      message: loginSuccess ? 'Login successful' : 'Login failed or additional verification required'
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error("❌ Login error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
