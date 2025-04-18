const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Flex backend is running!');
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email);


    const page = await browser.newPage();
    await page.goto('https://flex.amazon.com.au/', { waitUntil: 'networkidle2' });

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
    const loginSuccess = finalUrl.includes('flex.amazon.com.au');

    await browser.close();

    return res.status(200).json({
      success: loginSuccess,
      message: loginSuccess ? 'Login successful' : 'Login failed or 2FA required'
    });

  } catch (err) {
    console.error('❌ Login error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
