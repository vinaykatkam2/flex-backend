const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Amazon AU Login Attempt:", email);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://flex.amazon.com.au/', { waitUntil: 'networkidle2' });

    const signInButton = await page.$('a[href*="signin"]');
    if (signInButton) {
      await signInButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    await page.type('#ap_email', email);
    await page.click('#continue');
    await page.waitForSelector('#ap_password', { timeout: 5000 });

    await page.type('#ap_password', password);
    await page.click('#signInSubmit');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const finalUrl = page.url();
    console.log("🧭 Final URL:", finalUrl);
    await browser.close();

    if (finalUrl.includes('flex.amazon.com.au')) {
      return res.json({ success: true, message: 'Login successful' });
    } else {
      return res.status(401).json({ success: false, message: 'Login failed or needs verification' });
    }
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
